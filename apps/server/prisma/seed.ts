// Seed: 3 creators, 3 viewers (password "pass"), 2 matches. Safe to re-run (upserts).
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { DEFAULT_TIERS } from '../src/tiers';

const prisma = new PrismaClient();
const hash = await bcrypt.hash('pass', 10);

const creators = [
  { name: 'RohitReacts', bio: 'Ball-by-ball hype from Mumbai', tags: ['Hindi', 'Hype'], team: 'IND' },
  { name: 'AussieAnalyst', bio: 'Field placements and match-ups', tags: ['English', 'Analysis'], team: 'AUS' },
  { name: 'CoverDriveComedy', bio: 'Cricket, but make it funny', tags: ['English', 'Comedy'], team: 'ENG' },
];
const viewers = ['priya', 'arjun', 'sam'];

for (const c of creators) {
  await prisma.user.upsert({
    where: { name: c.name },
    update: {},
    create: {
      name: c.name,
      role: 'creator',
      passwordHash: hash,
      bio: c.bio,
      channel: { create: { displayName: c.name, tags: JSON.stringify(c.tags), favouriteTeam: c.team } },
    },
  });
}
for (const name of viewers) {
  await prisma.user.upsert({ where: { name }, update: {}, create: { name, role: 'viewer', passwordHash: hash } });
}

// 3 mock subscription tiers per creator channel (only if the channel has none yet).
for (const ch of await prisma.channel.findMany({ include: { _count: { select: { subTiers: true } } } })) {
  if (ch._count.subTiers === 0) await prisma.subTier.createMany({ data: DEFAULT_TIERS.map((t) => ({ ...t, channelId: ch.id })) });
}

const matches = [
  {
    externalId: 'seed-ind-aus',
    tournament: 'Border-Gavaskar T20 Series',
    teamA: 'IND',
    teamB: 'AUS',
    startsAt: new Date(Date.now() - 60 * 60 * 1000),
    status: 'live',
    scoreJson: '{}', // the ReplayFeed fills it (pnpm replay start)
  },
  {
    externalId: 'seed-eng-nz',
    tournament: 'Trans-Tasman Trophy',
    teamA: 'ENG',
    teamB: 'NZ',
    startsAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
    status: 'upcoming',
    scoreJson: '{}',
  },
];
for (const m of matches) {
  await prisma.match.upsert({ where: { externalId: m.externalId }, update: {}, create: m });
}

console.log(`seeded: ${await prisma.user.count()} users, ${await prisma.match.count()} matches`);
await prisma.$disconnect();
