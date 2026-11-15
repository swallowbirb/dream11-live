import { readFileSync } from 'node:fs';
import type { Score } from '@d11/shared';
import { prisma } from '../db';
import type { FeedStatus, MatchFeed, OnScore } from './feed';

/** A hand-written innings. Ball tokens: ".", "1"–"6", "W" (striker out), "wd", "nb" (+1, not a legal ball). */
type ReplayFile = {
  externalId: string;
  tournament: string;
  batting: string;
  bowling: string;
  batters: string[];
  overs: { bowler: string; balls: string }[];
};

const REAL_TIME_MS_PER_BALL = 30_000;

type Bat = { name: string; runs: number; balls: number };
type Bowl = { name: string; legal: number; runs: number; wickets: number };

/** Replays one innings ball by ball and keeps the score as it goes. */
class Innings {
  runs = 0;
  wickets = 0;
  legal = 0;
  recent: string[] = [];
  next = 2;
  striker: Bat;
  other: Bat;
  bowlers = new Map<string, Bowl>();
  bowler: Bowl | null = null;

  constructor(private f: ReplayFile) {
    this.striker = { name: f.batters[0], runs: 0, balls: 0 };
    this.other = { name: f.batters[1], runs: 0, balls: 0 };
  }

  get finished() {
    return this.wickets >= Math.min(10, this.f.batters.length - 1) || this.legal >= this.f.overs.length * 6;
  }

  play(bowlerName: string, token: string) {
    const bowler = this.bowlers.get(bowlerName) ?? { name: bowlerName, legal: 0, runs: 0, wickets: 0 };
    this.bowlers.set(bowlerName, bowler);
    this.bowler = bowler;
    this.recent = [...this.recent, token].slice(-6);

    if (token === 'wd' || token === 'nb') {
      this.runs += 1;
      bowler.runs += 1;
      if (token === 'nb') this.striker.balls += 1;
      return;
    }
    this.legal += 1;
    bowler.legal += 1;
    this.striker.balls += 1;
    if (token === 'W') {
      this.wickets += 1;
      bowler.wickets += 1;
      const name = this.f.batters[this.next++];
      if (name) this.striker = { name, runs: 0, balls: 0 };
    } else {
      const r = token === '.' ? 0 : Number(token);
      this.runs += r;
      bowler.runs += r;
      this.striker.runs += r;
      if (r % 2 === 1) this.swap();
    }
    if (this.legal % 6 === 0) this.swap(); // end of over
  }

  private swap() {
    [this.striker, this.other] = [this.other, this.striker];
  }

  score(): Score {
    const overs = (legal: number) => `${Math.floor(legal / 6)}.${legal % 6}`;
    const line = (b: Bat, onStrike: boolean) => ({ ...b, onStrike });
    return {
      batting: this.f.batting,
      bowling: this.f.bowling,
      runs: this.runs,
      wickets: this.wickets,
      overs: overs(this.legal),
      batters: [line(this.striker, true), line(this.other, false)],
      bowler: this.bowler
        ? { name: this.bowler.name, overs: overs(this.bowler.legal), runs: this.bowler.runs, wickets: this.bowler.wickets }
        : null,
      recent: this.recent,
      finished: this.finished,
    };
  }
}

export class ReplayFeed implements MatchFeed {
  private file: ReplayFile;
  private balls: { bowler: string; token: string }[];
  private innings: Innings | null = null;
  private matchId: string | null = null;
  private pos = 0;
  private speed = 10;
  private timer: NodeJS.Timeout | null = null;
  private run = 0; // bumped on start/stop so an in-flight tick from an older run doesn't reschedule

  constructor(path: string | URL, private onScore: OnScore) {
    this.file = JSON.parse(readFileSync(path, 'utf8'));
    this.balls = this.file.overs.flatMap((o) => o.balls.trim().split(/\s+/).map((token) => ({ bowler: o.bowler, token })));
  }

  status(): FeedStatus {
    return { running: this.timer !== null, matchId: this.matchId, ball: this.pos, total: this.balls.length, speed: this.speed };
  }

  async start(speed = 10) {
    this.stop();
    const run = this.run;
    this.speed = speed;
    const f = this.file;
    const match = await prisma.match.upsert({
      where: { externalId: f.externalId },
      update: {},
      create: { externalId: f.externalId, tournament: f.tournament, teamA: f.batting, teamB: f.bowling, startsAt: new Date() },
    });
    this.matchId = match.id;
    this.innings = new Innings(f);
    this.pos = 0;
    await this.publish();
    if (run === this.run) this.schedule(run);
    return this.status();
  }

  stop() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.run++;
    return this.status();
  }

  private schedule(run: number) {
    this.timer = setTimeout(() => void this.tick(run), REAL_TIME_MS_PER_BALL / this.speed);
  }

  private async tick(run: number) {
    const ball = this.balls[this.pos++];
    this.innings!.play(ball.bowler, ball.token);
    await this.publish();
    if (run !== this.run) return;
    if (this.innings!.finished || this.pos >= this.balls.length) this.timer = null;
    else this.schedule(run);
  }

  private async publish() {
    const score = this.innings!.score();
    await prisma.match.update({
      where: { id: this.matchId! },
      data: { scoreJson: JSON.stringify(score), status: score.finished ? 'completed' : 'live' },
    });
    await this.onScore(this.matchId!, score);
  }
}
