import type { Score } from '@d11/shared';

export type FeedStatus = { running: boolean; matchId: string | null; ball: number; total: number; speed: number };

/** Called after every ball (and once at start) with the match's new score. */
export type OnScore = (matchId: string, score: Score) => void | Promise<void>;

/** Source of live match data (DESIGN §5.4). ReplayFeed now; an ApiFeed later. */
export interface MatchFeed {
  /** speed = multiple of real time (real time ≈ 30 s a ball). Restarts from the first ball. */
  start(speed?: number): Promise<FeedStatus>;
  stop(): FeedStatus;
  status(): FeedStatus;
}
