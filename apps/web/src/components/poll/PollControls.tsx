import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BarChart3, Plus, Square } from 'lucide-react';
import type { PollState } from '@d11/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { post } from '@/lib/api';
import { PollResults } from './PollCard';

/** Dashboard: start a poll (question + 2–4 options), watch live counts, close it. */
export function PollControls({ streamId, poll, onPoll }: { streamId: string; poll: PollState | null; onPoll: (p: PollState) => void }) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const start = useMutation({
    mutationFn: () => post<{ poll: PollState }>(`/streams/${streamId}/polls`, { question, options: options.filter((o) => o.trim()) }),
    onSuccess: ({ poll }) => {
      onPoll(poll);
      setQuestion('');
      setOptions(['', '']);
    },
    onError: (e) => toast.error((e as Error).message),
  });
  const close = useMutation({
    mutationFn: () => post<{ poll: PollState }>(`/polls/${poll!.id}/close`),
    onSuccess: ({ poll }) => onPoll(poll),
  });
  const open = poll?.status === 'open';
  const valid = question.trim() && options.filter((o) => o.trim()).length >= 2;

  return (
    <section className="space-y-3 rounded-2xl bg-surface p-4 shadow-sm" data-testid="poll-controls">
      <h2 className="flex items-center gap-2 font-display text-lg font-bold">
        <BarChart3 className="size-5 text-brand" /> Poll
      </h2>
      {poll && (
        <div className="space-y-2">
          <p className="text-sm font-bold">{poll.question}</p>
          <PollResults poll={poll} />
          {open && (
            <Button variant="outline" className="w-full" onClick={() => close.mutate()} disabled={close.isPending}>
              <Square /> Close poll
            </Button>
          )}
        </div>
      )}
      {!open && (
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (valid) start.mutate();
          }}
        >
          <Input placeholder="Will India chase 180?" value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={120} name="poll-question" />
          {options.map((o, i) => (
            <Input
              key={i}
              placeholder={`Option ${i + 1}`}
              value={o}
              maxLength={40}
              name={`poll-option-${i}`}
              onChange={(e) => setOptions((os) => os.map((x, j) => (j === i ? e.target.value : x)))}
            />
          ))}
          <div className="flex gap-2">
            {options.length < 4 && (
              <Button type="button" variant="outline" onClick={() => setOptions((os) => [...os, ''])}>
                <Plus /> Option
              </Button>
            )}
            <Button type="submit" className="flex-1 font-semibold" disabled={!valid || start.isPending}>
              Start poll
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
