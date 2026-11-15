import { useEffect, useRef, useState, type ReactNode } from 'react';
import { PlayerFrame } from './LivePlayer';

/** Seconds into the loop a stream starts at, so bots sharing a clip aren't in sync. */
const offsetOf = (id: string) => [...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % 600;

function ClipEl({
  src,
  volume,
  muted,
  offset,
  onBlocked,
  className,
}: {
  src: string;
  volume: number;
  muted: boolean;
  offset: number;
  onBlocked: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.volume = volume;
  }, [volume]);
  // Try with sound first; if the browser blocks autoplay with sound, the parent mutes everything.
  useEffect(() => {
    const el = ref.current!;
    el.muted = muted;
    el.play().catch(() => !muted && onBlocked());
  }, [muted, onBlocked]);
  return (
    <video
      ref={ref}
      src={src}
      loop
      playsInline
      className={className}
      onLoadedMetadata={(e) => {
        const el = e.currentTarget;
        if (Number.isFinite(el.duration) && el.duration > 0) el.currentTime = offset % el.duration;
      }}
    />
  );
}

/** Demo bot stream: the same frame and controls as LivePlayer, playing two looping clips. */
export function BotPlayer({ match, cam, seed, overlay }: { match: string; cam: string; seed: string; overlay?: ReactNode }) {
  const [muted, setMuted] = useState(false);
  const block = useRef(() => setMuted(true)).current;
  const offset = offsetOf(seed);
  return (
    <PlayerFrame
      main={(cls, v) => <ClipEl src={match} volume={v.match} muted={muted} offset={offset} onBlocked={block} className={cls} />}
      cam={(cls, v) => <ClipEl src={cam} volume={v.creator} muted={muted} offset={offset} onBlocked={block} className={cls} />}
      hasMatchAudio
      hasMicAudio
      audioBlocked={muted}
      onUnmute={() => setMuted(false)}
      overlay={overlay}
    />
  );
}
