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
  streamId: z.string().min(1),
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

export type MatchSummary = {
  id: string;
  tournament: string;
  teamA: string;
  teamB: string;
  status: 'upcoming' | 'live' | 'completed';
  startsAt: string;
  /** Live score from the match feed; null before the first ball. */
  score: Score | null;
};

export type BatterLine = { name: string; runs: number; balls: number; onStrike: boolean };
export type BowlerLine = { name: string; overs: string; runs: number; wickets: number };

/** One innings' live score, as the MatchFeed produces it (stored in matches.scoreJson). */
export type Score = {
  batting: string;
  bowling: string;
  runs: number;
  wickets: number;
  /** Completed overs and legal balls, e.g. "12.3". */
  overs: string;
  batters: BatterLine[];
  bowler: BowlerLine | null;
  /** Last 6 deliveries, oldest first: ".", "1"–"6", "W", "wd", "nb". */
  recent: string[];
  finished: boolean;
};

/** S→C `score:update`, sent to every live stream room linked to the match. */
export type ScoreUpdate = { matchId: string; score: Score };

export type StreamInfo = {
  id: string;
  title: string;
  language: string;
  supportingTeam: string | null;
  status: 'starting' | 'live' | 'ended';
  startedAt: string;
  endedAt: string | null;
  channel: { id: string; displayName: string; userId: string };
  match: MatchSummary | null;
};

/** Returned by POST /api/streams and GET /api/streams/:id/token. */
export type StreamToken = { url: string; token: string };

/** S→C `stream:status`. viewerCount counts sockets in the room, minus the streamer's. */
export type StreamStatus = { streamId: string; viewerCount: number };
