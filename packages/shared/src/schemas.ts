import { z } from 'zod';

export const Role = z.enum(['creator', 'viewer']);
export type Role = z.infer<typeof Role>;

export const SignupBody = z.object({
  name: z.string().trim().min(2).max(24),
  password: z.string().min(3).max(100),
  role: Role,
});
export type SignupBody = z.infer<typeof SignupBody>;

export const LoginBody = z.object({
  name: z.string().trim().min(1),
  password: z.string().min(1),
});
export type LoginBody = z.infer<typeof LoginBody>;

export const GoLiveBody = z.object({
  title: z.string().trim().min(1).max(120),
  matchId: z.string().min(1),
  supportingTeam: z.string().optional(),
  language: z.string().min(1).default('English'),
});
export type GoLiveBody = z.infer<typeof GoLiveBody>;

export const ChatSend = z.object({
  body: z.string().trim().min(1).max(300),
  teamBadge: z.string().max(8).optional(),
});
export type ChatSend = z.infer<typeof ChatSend>;

export type PublicUser = { id: string; name: string; role: Role };

export type ChatMessage = {
  id: string;
  user: { name: string; isCreator: boolean };
  body: string;
  teamBadge: string | null;
  createdAt: string;
};
