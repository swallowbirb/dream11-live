import { useEffect, useRef, useState } from 'react';
import { Ban, Send, Trash2, Video } from 'lucide-react';
import { flag, type ChatMessage, type MatchSummary } from '@d11/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { SubBadge } from '@/components/channel/Subscribe';

// Stable per-name colour so chat reads like Twitch.
const NAME_COLOURS = ['#d11f26', '#1e7bd1', '#1e9e4a', '#8a3ffc', '#d1741f', '#c2185b', '#00897b', '#5d4037'];
const nameColour = (name: string) =>
  NAME_COLOURS[[...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % NAME_COLOURS.length];

export type Moderate = (a: { action: 'delete'; messageId: string } | { action: 'ban'; userId: string }) => void;

function ModButtons({ m, onModerate }: { m: ChatMessage; onModerate: Moderate }) {
  const btn =
    'grid size-6 place-items-center rounded-md bg-surface text-muted-foreground shadow-sm ring-1 ring-border transition hover:text-brand active:scale-90';
  return (
    <span className="absolute top-0.5 right-2 hidden gap-1 group-hover:flex group-focus-within:flex">
      <button type="button" className={btn} title="Delete message" aria-label={`Delete message from ${m.user.name}`} onClick={() => onModerate({ action: 'delete', messageId: m.id })}>
        <Trash2 className="size-3.5" />
      </button>
      <button
        type="button"
        className={btn}
        title={`Ban ${m.user.name}`}
        aria-label={`Ban ${m.user.name}`}
        onClick={() => {
          onModerate({ action: 'ban', userId: m.user.id });
          toast(`${m.user.name} is banned from your chat`);
        }}
      >
        <Ban className="size-3.5" />
      </button>
    </span>
  );
}

function Line({ m, onModerate }: { m: ChatMessage; onModerate?: Moderate }) {
  return (
    <li className="group relative px-3 py-1 text-sm leading-snug break-words hover:bg-muted/60" data-testid="chat-line">
      {onModerate && !m.user.isCreator && <ModButtons m={m} onModerate={onModerate} />}
      {m.user.isCreator && (
        <span
          title="Creator"
          className="mr-1 inline-flex translate-y-[-1px] items-center rounded bg-brand px-1 py-px align-middle text-[10px] font-bold text-white"
        >
          <Video className="mr-0.5 size-2.5" />
          CREATOR
        </span>
      )}
      {m.user.isSub && (
        <span className="mr-1">
          <SubBadge />
        </span>
      )}
      {m.teamBadge && <span className="mr-1" title={m.teamBadge}>{flag(m.teamBadge)}</span>}
      <span className="font-semibold" style={{ color: nameColour(m.user.name) }}>
        {m.user.name}
      </span>
      <span className="text-muted-foreground">: </span>
      <span>{m.body}</span>
    </li>
  );
}

export function ChatPanel({
  messages,
  onSend,
  match,
  className,
  onModerate,
}: {
  onModerate?: Moderate;
  messages: ChatMessage[];
  onSend: (body: string, teamBadge?: string) => void;
  match: MatchSummary | null;
  className?: string;
}) {
  const [text, setText] = useState('');
  const [badge, setBadge] = useState('');
  const list = useRef<HTMLUListElement>(null);
  const stick = useRef(true);

  // Auto-scroll unless the user has scrolled up to read.
  useEffect(() => {
    const el = list.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const submit = () => {
    const body = text.trim();
    if (!body) return;
    onSend(body, badge || undefined);
    setText('');
    stick.current = true;
  };

  return (
    <section className={cn('flex min-h-0 flex-col overflow-hidden rounded-2xl bg-surface shadow-sm', className)}>
      <header className="border-b px-4 py-2.5 font-display text-sm font-bold tracking-wide uppercase">Stream chat</header>
      <ul
        ref={list}
        onScroll={(e) => {
          const el = e.currentTarget;
          stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
        }}
        className="min-h-0 flex-1 overflow-y-auto py-2"
      >
        {messages.length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-muted-foreground">No messages yet. Say hi! 👋</li>
        )}
        {messages.map((m) => (
          <Line key={m.id} m={m} onModerate={onModerate} />
        ))}
      </ul>
      <form
        className="space-y-2 border-t p-3"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        {match && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="mr-1 text-muted-foreground">Badge</span>
            {[match.teamA, match.teamB, ''].map((t) => (
              <button
                key={t || 'none'}
                type="button"
                onClick={() => setBadge(t)}
                aria-pressed={badge === t}
                className={cn(
                  'rounded-full border px-2 py-0.5 font-semibold transition active:scale-95',
                  badge === t ? 'border-brand bg-accent text-accent-foreground' : 'border-border text-muted-foreground',
                )}
              >
                {t ? `${flag(t)} ${t}` : 'None'}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Input
            placeholder="Send a message"
            value={text}
            maxLength={300}
            onChange={(e) => setText(e.target.value)}
            aria-label="Chat message"
          />
          <Button type="submit" size="icon" aria-label="Send" disabled={!text.trim()}>
            <Send />
          </Button>
        </div>
      </form>
    </section>
  );
}
