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

/** The emoji tray, in order (DESIGN §3.1 Chat). */
export const REACTIONS = ['🔥', '😱', '👏', '🏏', '😂', '💔'] as const;
export type Reaction = (typeof REACTIONS)[number];
export type ReactionCounts = Partial<Record<Reaction, number>>;

/** C→S `reaction:batch`: taps since the last batch (client sends at most every 250 ms). */
export const ReactionBatch = z.object({
  streamId: z.string().min(1),
  counts: z.partialRecord(z.enum(REACTIONS), z.number().int().min(1).max(50)),
});
export type ReactionBatch = z.infer<typeof ReactionBatch>;

/** S→C `reaction:burst`, every 250 ms while a room has taps or hype: this tick's counts + hype 0–100. */
export type ReactionBurst = { streamId: string; counts: ReactionCounts; hype: number };

/** POST /api/streams/:id/polls (creator). */
export const PollCreate = z.object({
  question: z.string().trim().min(1).max(120),
  options: z.array(z.string().trim().min(1).max(40)).min(2).max(4),
});
export type PollCreate = z.infer<typeof PollCreate>;

/** C→S `poll:vote`: one vote per user per poll. */
export const PollVoteBody = z.object({ pollId: z.string().min(1), optionIndex: z.number().int().min(0).max(3) });
export type PollVoteBody = z.infer<typeof PollVoteBody>;

export type PollState = {
  id: string;
  streamId: string;
  question: string;
  options: string[];
  counts: number[];
  total: number;
  status: 'open' | 'closed';
};

/**
 * S→C `poll:update`: on start, every vote and close (to the room), and on room:join (to the joiner).
 * `myVote` is only set on messages sent to one user (their join, their own vote); keep the last known value.
 */
export type PollUpdate = { streamId: string; poll: PollState; myVote?: number | null };

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

/** A match on browse pages, with how many creators are live on it. */
export type MatchListItem = MatchSummary & { liveCount: number };

/** A live stream on browse pages (viewerCount from the socket room, like stream:status). */
export type LiveStream = StreamInfo & { viewerCount: number };

/** Returned by POST /api/streams and GET /api/streams/:id/token. */
export type StreamToken = { url: string; token: string };

/** S→C `stream:status`. viewerCount counts sockets in the room, minus the streamer's. */
export type StreamStatus = { streamId: string; viewerCount: number };

/** GET /api/channels/:id, and each row of GET /api/me/following. */
export type ChannelInfo = {
  id: string;
  userId: string;
  displayName: string;
  bio: string | null;
  tags: string[];
  favouriteTeam: string | null;
  followerCount: number;
  /** Whether the caller follows this channel. */
  following: boolean;
  /** The channel's live stream, if it's live now. */
  live: LiveStream | null;
};

/** S→C `notify`, to the user's own room (`user:<id>`). */
export type Notify = { type: 'live'; stream: StreamInfo };
