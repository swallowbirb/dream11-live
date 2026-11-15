import { useState } from 'react';
import { motion } from 'motion/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Lock, Star } from 'lucide-react';
import { toast } from 'sonner';
import type { ChannelInfo, SubTierInfo, TiersResponse } from '@d11/shared';
import { UserAvatar } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { api, post } from '@/lib/api';
import { useSession } from '@/lib/session';
import { cn } from '@/lib/utils';

type Step = 'pick' | 'checkout' | 'done';

/** Subscribe / Subscribed button + the mock checkout dialog. Hidden on your own channel. */
export function SubscribeButton({ channel, className }: { channel: ChannelInfo; className?: string }) {
  const me = useSession((s) => s.user);
  const qc = useQueryClient();
  const key = ['tiers', channel.id];
  const { data } = useQuery({ queryKey: key, queryFn: () => api<TiersResponse>(`/channels/${channel.id}/tiers`) });
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('pick');
  const [tierId, setTierId] = useState<string | null>(null);

  const subscribe = useMutation({
    mutationFn: () => post<TiersResponse>(`/channels/${channel.id}/subscribe`, { tierId }),
    onSuccess: (r) => {
      qc.setQueryData(key, r);
      setStep('done');
    },
    onError: (e) => toast.error(e.message),
  });
  const cancel = useMutation({
    mutationFn: () => api<TiersResponse>(`/channels/${channel.id}/subscribe`, { method: 'DELETE' }),
    onSuccess: (r) => {
      qc.setQueryData(key, r);
      setOpen(false);
      toast('Subscription cancelled');
    },
  });

  if (!data || me?.id === channel.userId) return null;
  const current = data.tiers.find((t) => t.id === data.mySub?.tierId) ?? null;
  const tier = data.tiers.find((t) => t.id === tierId) ?? null;

  const openDialog = () => {
    setTierId(current?.id ?? data.tiers[1]?.id ?? data.tiers[0]?.id ?? null);
    setStep('pick');
    setOpen(true);
  };

  return (
    <>
      <Button
        size="sm"
        onClick={openDialog}
        data-testid="subscribe-button"
        className={cn(
          'font-semibold',
          current ? 'bg-gold/15 text-[#8a6d10] hover:bg-gold/25' : 'bg-ink text-white hover:bg-ink/90',
          className,
        )}
      >
        <Star className={cn(current && 'fill-gold text-gold')} />
        {current ? `Subscribed · ${current.name}` : 'Subscribe'}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="gap-5 sm:max-w-md">
          {step === 'pick' && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <UserAvatar name={channel.displayName} className="size-11" />
                  <div className="text-left">
                    <DialogTitle className="font-display text-2xl">Subscribe to {channel.displayName}</DialogTitle>
                    <DialogDescription>Pick a tier. Your badge shows in chat straight away.</DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-2.5" role="radiogroup">
                {data.tiers.map((t) => (
                  <TierCard key={t.id} tier={t} selected={t.id === tierId} current={t.id === current?.id} onSelect={() => setTierId(t.id)} />
                ))}
              </div>
              <div className="space-y-2">
                <Button
                  size="lg"
                  className="w-full font-semibold"
                  disabled={!tier || tier.id === current?.id}
                  onClick={() => setStep('checkout')}
                >
                  {current ? 'Change tier' : 'Continue'}
                </Button>
                {current && (
                  <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={() => cancel.mutate()}>
                    Cancel subscription
                  </Button>
                )}
              </div>
            </>
          )}

          {step === 'checkout' && tier && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">Checkout</DialogTitle>
                <DialogDescription>Review your subscription.</DialogDescription>
              </DialogHeader>
              <div className="divide-y rounded-xl border">
                <Row label="Channel" value={channel.displayName} />
                <Row label="Tier" value={tier.name} />
                <Row label="Billed" value="Monthly" />
                <div className="flex items-center justify-between bg-muted/50 px-4 py-3">
                  <span className="font-semibold">Total today</span>
                  <span className="font-display text-xl font-bold tabular">{tier.displayPrice.replace('/mo', '')}</span>
                </div>
              </div>
              <p className="flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-xs text-accent-foreground">
                <Lock className="size-3.5 shrink-0" /> Mock checkout: this is a prototype, no payment is taken.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep('pick')}>
                  Back
                </Button>
                <Button className="flex-[2] font-semibold" onClick={() => subscribe.mutate()} disabled={subscribe.isPending}>
                  {subscribe.isPending ? 'Confirming…' : `Confirm · ${tier.displayPrice}`}
                </Button>
              </div>
            </>
          )}

          {step === 'done' && tier && (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <motion.span
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                className="grid size-16 place-items-center rounded-full bg-success text-white"
              >
                <Check className="size-8" strokeWidth={3} />
              </motion.span>
              <DialogTitle className="font-display text-2xl">You're a {tier.name}!</DialogTitle>
              <DialogDescription>
                Thanks for supporting {channel.displayName}. Your <SubBadge /> badge is live in chat.
              </DialogDescription>
              <Button className="mt-2 w-full font-semibold" onClick={() => setOpen(false)}>
                Back to the stream
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function TierCard({ tier, selected, current, onSelect }: { tier: SubTierInfo; selected: boolean; current: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      data-testid="tier-card"
      className={cn(
        'flex w-full items-start gap-3 rounded-xl border-2 p-3.5 text-left transition active:scale-[0.99]',
        selected ? 'border-brand bg-accent/60' : 'border-border hover:border-brand/40',
      )}
    >
      <span className={cn('mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2', selected ? 'border-brand bg-brand' : 'border-border')}>
        {selected && <span className="size-2 rounded-full bg-white" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="font-display text-lg font-bold">{tier.name}</span>
          {Array.from({ length: tier.rank }, (_, i) => (
            <Star key={i} className="-mx-0.5 size-3.5 fill-gold text-gold" />
          ))}
          {current && <span className="rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success">Current</span>}
        </span>
        <span className="block text-sm text-muted-foreground">{tier.perks}</span>
      </span>
      <span className="font-display text-lg font-bold whitespace-nowrap tabular">{tier.displayPrice}</span>
    </button>
  );
}

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between px-4 py-2.5 text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-semibold">{value}</span>
  </div>
);

export function SubBadge() {
  return (
    <span
      title="Subscriber"
      className="inline-flex translate-y-[-1px] items-center rounded bg-gold px-1 py-px align-middle text-[10px] font-bold text-white"
    >
      <Star className="mr-0.5 size-2.5 fill-white" />
      SUB
    </span>
  );
}
