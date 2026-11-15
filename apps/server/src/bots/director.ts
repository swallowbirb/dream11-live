// Demo bots: six always-live creator streams with simulated chat, reactions, polls and audience.
// Bot streams play looping clips in the browser (providerRef "bot:<match clip>,<cam clip>", see streams.ts), so
// they cost no LiveKit minutes. Chat, reactions and polls only run while someone has the stream open.
// Off with BOTS=0.
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { Server } from 'socket.io';
import type { Reaction, ReactionCounts, Score } from '@d11/shared';
import { prisma } from '../db';
import { DEFAULT_TIERS } from '../tiers';
import { addReactions, broadcastCount, isWatched, postChat } from '../realtime';
import { broadcast, closePoll, openPoll } from '../polls';
import { botViewers } from './viewers';
import { CHATTERS, LINES, POLLS, type Persona, PERSONAS } from './script';

const TICK_MS = 1000;
const POLL_OPEN_MS = 45_000;
const KEEP_MESSAGES = 200; // per bot stream; older ones are pruned

type Bot = {
  persona: Persona;
  streamId: string;
  creatorId: string;
  matchId: string;
  teams: [string, string];
  score: Score | null;
  nextChat: number;
  nextPoll: number;
  poll: { id: string; options: number; closeAt: number; favourite: number; voters: Set<string> } | null;
};

const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);
const pick = <T>(xs: readonly T[]): T => xs[Math.floor(Math.random() * xs.length)];

export class BotDirector {
  private bots: Bot[] = [];
  private chatters: { id: string }[] = [];

  constructor(private io: Server) {}

  async start() {
    const hash = await bcrypt.hash(randomUUID(), 10); // nobody can log in as a bot
    for (const name of CHATTERS) {
      const u = await prisma.user.upsert({ where: { name }, update: {}, create: { name, role: 'viewer', passwordHash: hash } });
      this.chatters.push({ id: u.id });
    }

    for (const p of PERSONAS) {
      const match = await prisma.match.findUnique({ where: { externalId: p.match } });
      if (!match) continue;
      const user = await prisma.user.upsert({
        where: { name: p.name },
        update: {},
        create: {
          name: p.name,
          role: 'creator',
          passwordHash: hash,
          bio: p.bio,
          channel: { create: { displayName: p.name, tags: JSON.stringify(p.tags), favouriteTeam: p.team } },
        },
        include: { channel: true },
      });
      const channel = user.channel!;
      if (!(await prisma.subTier.count({ where: { channelId: channel.id } })))
        await prisma.subTier.createMany({ data: DEFAULT_TIERS.map((t) => ({ ...t, channelId: channel.id })) });
      await this.seedSubs(channel.id);

      const providerRef = `bot:${p.clip},${p.cam}`;
      const live = await prisma.stream.findFirst({ where: { channelId: channel.id, status: 'live' } });
      const stream = live
        ? await prisma.stream.update({ where: { id: live.id }, data: { providerRef, title: p.title, matchId: match.id } })
        : await prisma.stream.create({
            data: {
              channelId: channel.id,
              matchId: match.id,
              title: p.title,
              language: p.language,
              supportingTeam: p.team,
              status: 'live',
              providerRef,
              startedAt: new Date(Date.now() - rand(10, 90) * 60_000),
            },
          });
      botViewers.set(stream.id, Math.round(rand(p.audience[0], p.audience[1])));
      this.bots.push({
        persona: p,
        streamId: stream.id,
        creatorId: user.id,
        matchId: match.id,
        teams: [match.teamA, match.teamB],
        score: null,
        nextChat: 0,
        nextPoll: Date.now() + rand(20_000, 60_000),
        poll: null,
      });
    }

    setInterval(() => void this.tick().catch((e) => console.error('[bots]', e)), TICK_MS);
    setInterval(() => void this.prune().catch((e) => console.error('[bots]', e)), 10 * 60_000);
    console.log(`[bots] ${this.bots.length} bot streams live`);
  }

  /** About a quarter of the chatters subscribe to each bot channel (SUB badges in chat). */
  private async seedSubs(channelId: string) {
    if (await prisma.subscription.count({ where: { channelId } })) return;
    const tiers = await prisma.subTier.findMany({ where: { channelId }, orderBy: { rank: 'asc' } });
    const subs = this.chatters.filter(() => Math.random() < 0.25);
    await prisma.subscription.createMany({
      data: subs.map((c) => ({ userId: c.id, channelId, tierId: pick(tiers).id })),
    });
  }

  /** Called by the match feed after every ball. */
  onScore(matchId: string, score: Score) {
    for (const b of this.bots) {
      if (b.matchId !== matchId) continue;
      const fresh = score.overs === '0.0' && score.recent.length === 0;
      b.score = score;
      if (!isWatched(b.streamId)) continue;
      if (fresh) {
        this.later(b, 500, () => this.say(b, pick(LINES.newInnings)));
        continue;
      }
      const ball = score.recent.at(-1);
      const event = ball === '6' ? 'six' : ball === '4' ? 'four' : ball === 'W' ? 'wicket' : ball === 'wd' || ball === 'nb' ? 'extra' : ball === '.' ? 'dot' : null;
      if (!event) continue;
      const [lines, burst] = EVENTS[event];
      for (let i = 0; i < lines; i++) this.later(b, rand(300, 4000), () => this.say(b, pick(LINES[event])));
      if (Math.random() < 0.35) this.later(b, rand(800, 2500), () => this.creatorSays(b, pick(b.persona.react[event] ?? LINES[event])));
      for (let t = 0; t < 4; t++) this.later(b, t * 400, () => addReactions(b.streamId, spread(burst, 4)));
      if (score.finished) this.later(b, 3000, () => this.say(b, pick(LINES.inningsOver)));
    }
  }

  private later(b: Bot, ms: number, fn: () => unknown) {
    setTimeout(() => {
      if (isWatched(b.streamId)) Promise.resolve(fn()).catch((e) => console.error('[bots]', e));
    }, ms);
  }

  private async tick() {
    const now = Date.now();
    const second = Math.floor(now / 1000);
    for (const b of this.bots) {
      // Audience drifts inside the persona's range; pushed to watchers every 5 s.
      const [lo, hi] = b.persona.audience;
      const v = botViewers.get(b.streamId) ?? lo;
      botViewers.set(b.streamId, Math.round(Math.min(hi, Math.max(lo, v + rand(-0.006, 0.007) * v))));
      if (!isWatched(b.streamId)) continue;
      if (second % 5 === 0) await broadcastCount(b.streamId);

      if (now >= b.nextChat) {
        b.nextChat = now + rand(1200, 4200);
        if (Math.random() < 0.06) await this.creatorSays(b, pick(b.persona.chat));
        else await this.say(b, pick(b.score ? LINES.general : LINES.preMatch));
      }

      if (Math.random() < 0.45) addReactions(b.streamId, { [pick(IDLE_EMOJI)]: 1 + Math.floor(Math.random() * 2) });

      await this.runPoll(b, now);
    }
  }

  private async runPoll(b: Bot, now: number) {
    if (!b.poll && now >= b.nextPoll) {
      const q = pick(b.score ? POLLS.live : POLLS.preMatch);
      const teams = (t: string) => t.replace('{a}', b.teams[0]).replace('{b}', b.teams[1]);
      const options = q.options.map(teams);
      const poll = await openPoll(this.io, b.streamId, teams(q.question), options);
      if (!poll) return;
      b.poll = { id: poll.id, options: options.length, closeAt: now + POLL_OPEN_MS, favourite: Math.floor(Math.random() * options.length), voters: new Set() };
      await this.creatorSays(b, pick(LINES.pollUp));
      return;
    }
    if (!b.poll) return;
    const p = b.poll;
    if (now >= p.closeAt) {
      await closePoll(this.io, p.id);
      b.poll = null;
      b.nextPoll = now + rand(120_000, 240_000);
      return;
    }
    if (Math.random() < 0.6) {
      const fresh = this.chatters.filter((c) => !p.voters.has(c.id));
      const n = Math.min(fresh.length, 1 + Math.floor(Math.random() * 3));
      if (!n) return;
      const voters = [...fresh].sort(() => Math.random() - 0.5).slice(0, n);
      voters.forEach((c) => p.voters.add(c.id));
      await prisma.pollVote.createMany({
        data: voters.map((c) => ({
          pollId: p.id,
          userId: c.id,
          optionIndex: Math.random() < 0.45 ? p.favourite : Math.floor(Math.random() * p.options),
        })),
      });
      await broadcast(this.io, p.id);
    }
  }

  private say(b: Bot, template: string) {
    const c = pick(this.chatters);
    const badge = Math.random() < 0.7 ? pick(b.teams) : null;
    return postChat(b.streamId, c.id, this.fill(b, template, badge), badge);
  }

  private creatorSays(b: Bot, template: string) {
    return postChat(b.streamId, b.creatorId, this.fill(b, template, b.persona.team), b.persona.team);
  }

  /** {striker} {bowler} {team} {other} {score} from the latest ball. */
  private fill(b: Bot, t: string, team: string | null) {
    const s = b.score;
    const mine = team ?? pick(b.teams);
    return t
      .replaceAll('{striker}', s?.batters.find((x) => x.onStrike)?.name.split(' ').at(-1) ?? 'the opener')
      .replaceAll('{bowler}', s?.bowler?.name.split(' ').at(-1) ?? 'the bowler')
      .replaceAll('{score}', s ? `${s.runs}/${s.wickets}` : '0/0')
      .replaceAll('{team}', mine)
      .replaceAll('{other}', b.teams.find((x) => x !== mine) ?? b.teams[1]);
  }

  /** Keeps the newest KEEP_MESSAGES chat messages per bot stream. */
  private async prune() {
    for (const b of this.bots) {
      const cut = await prisma.chatMessage.findFirst({
        where: { streamId: b.streamId },
        orderBy: { createdAt: 'desc' },
        skip: KEEP_MESSAGES,
        select: { createdAt: true },
      });
      if (cut) await prisma.chatMessage.deleteMany({ where: { streamId: b.streamId, createdAt: { lte: cut.createdAt } } });
    }
  }
}

type Event = 'six' | 'four' | 'wicket' | 'extra' | 'dot';
/** Chat lines and reaction taps (spread over ~1.6 s) per event. */
const EVENTS: Record<Event, [number, ReactionCounts]> = {
  six: [6, { '🔥': 40, '🏏': 16, '😱': 10, '👏': 10 }],
  four: [4, { '🔥': 20, '👏': 14, '🏏': 8 }],
  wicket: [6, { '😱': 30, '💔': 20, '👏': 10, '🔥': 8 }],
  extra: [1, { '😂': 6 }],
  dot: [0, { '👏': 2 }],
};
const IDLE_EMOJI: Reaction[] = ['🔥', '🔥', '🏏', '👏', '😂'];

/** One of n equal slices of a burst (rounded up so small counts still show). */
function spread(c: ReactionCounts, n: number): ReactionCounts {
  return Object.fromEntries(Object.entries(c).map(([k, v]) => [k, Math.ceil((v ?? 0) / n)]));
}
