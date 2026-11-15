import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { Room, RoomEvent, Track, type RemoteAudioTrack, type RemoteTrack, type RemoteVideoTrack } from 'livekit-client';
import { Columns2, Mic, PictureInPicture2, Tv, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

type Tracks = Partial<Record<Track.Source, RemoteTrack>>;
type Layout = 'pip' | 'side';

function VideoEl({ track, className }: { track: RemoteVideoTrack; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = ref.current!;
    track.attach(el);
    return () => {
      track.detach(el);
    };
  }, [track]);
  return <video ref={ref} playsInline muted className={className} data-source={track.source} />;
}

function AudioEl({ track, volume }: { track: RemoteAudioTrack; volume: number }) {
  const ref = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    const el = ref.current!;
    track.attach(el);
    return () => {
      track.detach(el);
    };
  }, [track]);
  useEffect(() => {
    if (ref.current) ref.current.volume = volume;
  }, [volume, track]);
  return <audio ref={ref} data-source={track.source} />;
}

/**
 * Subscribes to a stream's LiveKit room and arranges the two parts:
 * match (screen_share + screen_share_audio) and facecam (camera + microphone).
 */
export function LivePlayer({
  url,
  token,
  onPublisherLeft,
  overlay,
}: {
  url: string;
  token: string;
  onPublisherLeft?: () => void;
  /** Drawn over the video frame (e.g. floating reactions); doesn't take pointer events. */
  overlay?: ReactNode;
}) {
  const [tracks, setTracks] = useState<Tracks>({});
  const [audioBlocked, setAudioBlocked] = useState(false);
  const roomRef = useRef<Room | null>(null);
  const leftRef = useRef(onPublisherLeft);
  leftRef.current = onPublisherLeft;

  useEffect(() => {
    const room = new Room({ adaptiveStream: true, dynacast: true });
    roomRef.current = room;
    const put = (source: Track.Source, track: RemoteTrack | undefined) => setTracks((t) => ({ ...t, [source]: track }));
    // Listeners before connect(), or tracks already in the room are missed (P1 spike).
    room
      .on(RoomEvent.TrackSubscribed, (track, pub) => put(pub.source, track))
      .on(RoomEvent.TrackUnsubscribed, (_track, pub) => put(pub.source, undefined))
      .on(RoomEvent.AudioPlaybackStatusChanged, () => setAudioBlocked(!room.canPlaybackAudio))
      .on(RoomEvent.ParticipantDisconnected, () => leftRef.current?.());
    room
      .connect(url, token)
      .then(() => setAudioBlocked(!room.canPlaybackAudio))
      .catch(() => {}); // StrictMode's dev unmount disconnects mid-connect
    return () => {
      room.disconnect();
    };
  }, [url, token]);

  const matchVideo = tracks[Track.Source.ScreenShare] as RemoteVideoTrack | undefined;
  const camVideo = tracks[Track.Source.Camera] as RemoteVideoTrack | undefined;
  const matchAudio = tracks[Track.Source.ScreenShareAudio] as RemoteAudioTrack | undefined;
  const micAudio = tracks[Track.Source.Microphone] as RemoteAudioTrack | undefined;
  const main = matchVideo ?? camVideo;

  return (
    <PlayerFrame
      main={main && ((cls) => <VideoEl track={main} className={cls} />)}
      cam={matchVideo && camVideo && ((cls) => <VideoEl track={camVideo} className={cls} />)}
      audio={(v) => (
        <>
          {matchAudio && <AudioEl track={matchAudio} volume={v.match} />}
          {micAudio && <AudioEl track={micAudio} volume={v.creator} />}
        </>
      )}
      hasMatchAudio={!!matchAudio}
      hasMicAudio={!!micAudio}
      audioBlocked={audioBlocked}
      onUnmute={() => roomRef.current?.startAudio().then(() => setAudioBlocked(false))}
      overlay={overlay}
    />
  );
}

export type Volumes = { match: number; creator: number };
type Render = (className: string, v: Volumes) => ReactNode;

/**
 * The player frame and controls shared by LivePlayer and BotPlayer: main video, facecam as draggable PiP or
 * side by side, overlay, unmute prompt, layout toggle and the two volume sliders.
 */
export function PlayerFrame({
  main,
  cam,
  audio,
  hasMatchAudio,
  hasMicAudio,
  audioBlocked,
  onUnmute,
  overlay,
}: {
  main?: Render | false;
  /** Only when there is a separate match video to put it next to. */
  cam?: Render | false;
  audio?: (v: Volumes) => ReactNode;
  hasMatchAudio: boolean;
  hasMicAudio: boolean;
  audioBlocked: boolean;
  onUnmute: () => void;
  overlay?: ReactNode;
}) {
  const [layout, setLayout] = useState<Layout>('pip');
  const [matchVol, setMatchVol] = useState(0.8);
  const [creatorVol, setCreatorVol] = useState(1);
  const frame = useRef<HTMLDivElement>(null);
  const v: Volumes = { match: matchVol, creator: creatorVol };
  const both = !!(main && cam);

  return (
    <div className="space-y-2">
      <div
        ref={frame}
        className="relative aspect-video overflow-hidden rounded-2xl bg-ink shadow-lg"
        data-testid="player"
      >
        {!main && (
          <div className="grid size-full place-items-center text-sm text-white/60">
            <div className="flex flex-col items-center gap-2">
              <Tv className="size-10 animate-pulse opacity-60" />
              Connecting to stream…
            </div>
          </div>
        )}

        {/* The main video element stays mounted across layout switches: re-attaching it can leave an
            adaptive-stream track paused (match video went black after an early switch). */}
        <div
          className={
            both && layout === 'side' ? 'grid size-full grid-cols-[2fr_1fr] items-center gap-1 bg-ink' : 'contents'
          }
        >
          {main && main('size-full object-contain', v)}
          {both && layout === 'side' && cam('aspect-video w-full rounded-md object-cover', v)}
        </div>

        {both && layout === 'pip' && (
          <motion.div
            drag
            dragConstraints={frame}
            dragMomentum={false}
            whileDrag={{ scale: 1.04 }}
            className="absolute right-3 bottom-3 z-10 aspect-video w-1/4 min-w-28 cursor-grab overflow-hidden rounded-lg border-2 border-white/80 shadow-xl active:cursor-grabbing"
            data-testid="pip"
          >
            {cam('pointer-events-none size-full object-cover', v)}
          </motion.div>
        )}

        {overlay && <div className="pointer-events-none absolute inset-0 z-[15] overflow-hidden">{overlay}</div>}

        {audioBlocked && main && (
          <button
            onClick={onUnmute}
            className="absolute inset-x-0 top-3 z-20 mx-auto flex w-fit items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink shadow-lg active:scale-95"
          >
            <VolumeX className="size-4 text-brand" /> Tap to unmute
          </button>
        )}
      </div>

      {audio?.(v)}

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl bg-surface px-4 py-3 shadow-sm">
        {both && (
          <div className="flex rounded-lg bg-muted p-0.5">
            {(
              [
                ['pip', 'PiP', PictureInPicture2],
                ['side', 'Side by side', Columns2],
              ] as const
            ).map(([id, label, Icon]) => (
              <Button
                key={id}
                size="sm"
                variant="ghost"
                onClick={() => setLayout(id)}
                className={cn('h-7 gap-1.5 text-xs', layout === id && 'bg-surface shadow-sm hover:bg-surface')}
              >
                <Icon className="size-3.5" /> {label}
              </Button>
            ))}
          </div>
        )}
        <VolumeControl label="Match" Icon={Volume2} value={matchVol} onChange={setMatchVol} disabled={!hasMatchAudio} />
        <VolumeControl label="Creator" Icon={Mic} value={creatorVol} onChange={setCreatorVol} disabled={!hasMicAudio} />
      </div>
    </div>
  );
}

function VolumeControl({
  label,
  Icon,
  value,
  onChange,
  disabled,
}: {
  label: string;
  Icon: typeof Mic;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <label className={cn('flex min-w-40 flex-1 items-center gap-2 text-xs font-semibold', disabled && 'opacity-50')}>
      <Icon className="size-4 text-muted-foreground" />
      <span className="w-14">{label}</span>
      <Slider
        aria-label={`${label} volume`}
        min={0}
        max={100}
        step={5}
        value={[Math.round(value * 100)]}
        onValueChange={([v]) => onChange(v / 100)}
        disabled={disabled}
      />
    </label>
  );
}
