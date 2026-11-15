// Who the demo bots are and what they say. Templates: {striker} {bowler} {score} {team} {other}.
// Clips live in apps/web/public/bots/: match-N + cam-N for the Nth persona. Real footage goes in with
// apps/web/scripts/import-bot-clips.sh; apps/web/scripts/bot-media.sh makes placeholders.

type Event = 'six' | 'four' | 'wicket' | 'extra' | 'dot';

export type Persona = {
  name: string;
  bio: string;
  tags: string[];
  team: string;
  match: string; // Match.externalId
  title: string;
  language: string;
  clip: string;
  cam: string;
  audience: [number, number];
  /** The creator's own chat lines, now and then. */
  chat: string[];
  react: Partial<Record<Event, string[]>>;
};

export const PERSONAS: Persona[] = [
  {
    name: 'HinglishHitman',
    bio: 'Har ball pe hype. Hindi + English watch-along',
    tags: ['Hindi', 'Hype'],
    team: 'IND',
    match: 'seed-ind-aus',
    title: 'IND vs AUS LIVE 🔥 Hindi watch-along, full josh!',
    language: 'Hindi',
    clip: 'match-1.webm',
    cam: 'cam-1.webm',
    audience: [2400, 3600],
    chat: ['Chat full josh mein hai aaj 🔥', 'Follow kar lo doston, kal bhi live hain', 'Kya scene hai bhai, {score}!', 'Subs ka shukriya ❤️'],
    react: { six: ['CHHAKKA! 🔥🔥🔥', 'Ye gaya stadium ke bahar!'], wicket: ['Nahiii 💔', 'Bada wicket gaya yaar'], four: ['CHAUKA! Shandaar shot'] },
  },
  {
    name: 'BaggyGreenBen',
    bio: 'Aussie fan, numbers nerd, field placement obsessive',
    tags: ['English', 'Analysis'],
    team: 'AUS',
    match: 'seed-ind-aus',
    title: 'IND v AUS | Ball-by-ball tactics + live field maps',
    language: 'English',
    clip: 'match-2.webm',
    cam: 'cam-2.webm',
    audience: [900, 1500],
    chat: ['Watch where {bowler} sets the fine leg here', 'Run rate check: {score}, very healthy for {team}', 'Thanks for the subs legends 🙌', 'Poll ideas welcome in chat'],
    react: { wicket: ['GOT HIM! That was set up two balls ago', 'Plan worked to perfection'], six: ['Wrong length and punished for it', 'Need a man back on the rope there'] },
  },
  {
    name: 'SpinWizardSana',
    bio: 'Former club leggie breaking down every delivery',
    tags: ['English', 'Hindi', 'Analysis'],
    team: 'IND',
    match: 'seed-ind-aus',
    title: 'Spin & strategy: IND vs AUS deep dive',
    language: 'English',
    clip: 'match-3.webm',
    cam: 'cam-3.webm',
    audience: [600, 1100],
    chat: ['{striker} using the crease beautifully', 'Keep an eye on the wrist position from {bowler}', 'Welcome in everyone, grab a chai ☕'],
    react: { four: ['Late cut, pure class'], wicket: ['Beaten in the flight!'] },
  },
  {
    name: 'CricMemesDaily',
    bio: 'Cricket, but every ball is a meme',
    tags: ['English', 'Comedy'],
    team: 'IND',
    match: 'seed-ind-aus',
    title: 'IND vs AUS but it’s just memes 😂',
    language: 'English',
    clip: 'match-4.webm',
    cam: 'cam-4.webm',
    audience: [1300, 2200],
    chat: ['Me pretending to understand DRS 😂', 'Chat, who has the meme for this', 'Okay that bowler’s run-up is a whole cardio session'],
    react: { six: ['Ball has entered the group chat 😂'], extra: ['Free runs, free vibes 😂'] },
  },
  {
    name: 'BarmyArmyBeth',
    bio: 'Travelling ENG fan, trumpet sold separately',
    tags: ['English', 'Hype'],
    team: 'ENG',
    match: 'seed-eng-nz',
    title: 'ENG v NZ build-up | team news, predictions, songs',
    language: 'English',
    clip: 'match-5.webm',
    cam: 'cam-5.webm',
    audience: [500, 900],
    chat: ['Team sheets any minute now 👀', 'Predictions in chat please', 'Who’s staying up for this one?'],
    react: {},
  },
  {
    name: 'SilverFernSteve',
    bio: 'NZ cricket every day, every format',
    tags: ['English', 'Analysis'],
    team: 'NZ',
    match: 'seed-eng-nz',
    title: 'ENG v NZ pre-match: pitch report & XI talk',
    language: 'English',
    clip: 'match-6.webm',
    cam: 'cam-6.webm',
    audience: [350, 700],
    chat: ['Surface looks a bit tacky, spinners in play', 'Toss could decide this', 'Kia ora chat 👋'],
    react: {},
  },
];

const FIRST = ['rahul', 'neha', 'mike', 'aisha', 'vikram', 'jess', 'tom', 'kavya', 'dev', 'ollie', 'sneha', 'liam', 'arya', 'kabir', 'zoe'];
const SUFFIX = ['_fan', '99', '_cricket', '07', '_xi', 'ontour'];
/** 60 chat names: fixed, so restarts reuse the same users. */
export const CHATTERS = FIRST.flatMap((f, i) => [SUFFIX[i % 6], SUFFIX[(i + 2) % 6], SUFFIX[(i + 3) % 6], SUFFIX[(i + 5) % 6]].map((s) => `${f}${s}`));

export const LINES = {
  general: [
    'what a game this is',
    '{team} all the way 💪',
    'who else is watching from office 😂',
    '{striker} looking set today',
    'tight bowling from {bowler}',
    'score check {score}',
    'this stream > TV commentary',
    'anyone else on the edge of their seat',
    'need a big over here',
    'hello from Pune 👋',
    'hello from Sydney 👋',
    'field is so attacking right now',
    '{other} need a wicket badly',
    'just joined, what did I miss?',
    'bowling change soon?',
    'pressure building 😬',
    '{team} fans make some noise',
    'that last over was tidy',
    'the crowd sound is unreal',
    'chat moving so fast',
  ],
  preMatch: [
    'when does it start?',
    'who wins the toss?',
    '{team} looking strong on paper',
    'pitch looks flat, 180+ game',
    'hello from Auckland 👋',
    'hello from London 👋',
    'team news when?',
    '{other} have the better bowling attack tbh',
    'weather looks clear 🌤️',
    'calling it now: {team} by 20 runs',
    'first time catching this stream, love it',
  ],
  six: ['SIXXX 🔥🔥', 'MAXIMUM!!', 'that’s out of the ground 🚀', '{striker} you beauty', 'what a strike', '🔥🔥🔥', 'sent him into the stands', 'clean as you like'],
  four: ['FOUR! 👏', 'what timing', 'races away to the rope', 'beautiful shot from {striker}', 'gap found 🏏'],
  wicket: ['OUTTTT 😱', 'big wicket!!', 'noooo 💔', '{bowler} strikes!', 'game changer right there', 'what a ball', 'gone!! 😱'],
  extra: ['wide 🙄', 'free runs lol', 'discipline please {bowler}'],
  dot: ['dot ball', 'good ball'],
  newInnings: ['new innings, let’s goooo 🏏', 'here we go again!', 'fresh start, {team} to bat'],
  inningsOver: ['innings over! what a show', 'that’s the innings, {score} final'],
  pollUp: ['Poll’s up, vote now! 👆', 'New poll in chat, get voting', 'Quick poll, let me know 👇'],
};

export const POLLS = {
  live: [
    { question: 'Next ball?', options: ['Dot', 'Boundary', 'Wicket'] },
    { question: 'Who wins this match?', options: ['{a}', '{b}'] },
    { question: 'Runs in the next over?', options: ['0–5', '6–10', '11+'] },
    { question: 'Final score for {a}?', options: ['Under 160', '160–190', '190+'] },
    { question: 'Best bowler so far?', options: ['Pace', 'Spin'] },
  ],
  preMatch: [
    { question: 'Who wins the toss?', options: ['{a}', '{b}'] },
    { question: 'Bat or bowl first?', options: ['Bat', 'Bowl'] },
    { question: 'Who wins it?', options: ['{a}', '{b}'] },
  ],
};
