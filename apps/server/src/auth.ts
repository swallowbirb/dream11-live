import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { LoginBody, SignupBody, type PublicUser } from '@d11/shared';
import { prisma } from './db';

declare module 'fastify' {
  interface FastifyRequest {
    user: PublicUser & { channelId: string | null };
  }
}

export async function userForToken(token: string | undefined) {
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: { include: { channel: { select: { id: true } } } } },
  });
  if (!session) return null;
  const { id, name, role } = session.user;
  return { id, name, role: role as PublicUser['role'], channelId: session.user.channel?.id ?? null };
}

/** preHandler: 401 unless `Authorization: Bearer <token>` matches a session. */
export async function requireUser(req: FastifyRequest, reply: FastifyReply) {
  const token = req.headers.authorization?.replace(/^Bearer /, '');
  const user = await userForToken(token);
  if (!user) return reply.code(401).send({ error: 'Not logged in' });
  req.user = user;
}

async function startSession(userId: string) {
  const token = randomBytes(24).toString('hex');
  await prisma.session.create({ data: { token, userId } });
  return token;
}

export async function authRoutes(app: FastifyInstance) {
  app.post('/api/auth/signup', async (req, reply) => {
    const parsed = SignupBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Name (2+ chars) and password (3+ chars) required' });
    const { name, password, role } = parsed.data;
    if (await prisma.user.findUnique({ where: { name } })) return reply.code(409).send({ error: 'That name is taken' });
    const user = await prisma.user.create({
      data: {
        name,
        role,
        passwordHash: await bcrypt.hash(password, 10),
        ...(role === 'creator' ? { channel: { create: { displayName: name } } } : {}),
      },
    });
    const token = await startSession(user.id);
    return { token, user: await userForToken(token) };
  });

  app.post('/api/auth/login', async (req, reply) => {
    const parsed = LoginBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Name and password required' });
    const user = await prisma.user.findUnique({ where: { name: parsed.data.name } });
    if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash)))
      return reply.code(401).send({ error: 'Wrong name or password' });
    const token = await startSession(user.id);
    return { token, user: await userForToken(token) };
  });

  app.post('/api/auth/logout', { preHandler: requireUser }, async (req) => {
    const token = req.headers.authorization!.replace(/^Bearer /, '');
    await prisma.session.delete({ where: { token } });
    return { ok: true };
  });

  app.get('/api/me', { preHandler: requireUser }, async (req) => ({ user: req.user }));
}
