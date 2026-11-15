import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  createLocalTracks,
  Room,
  Track,
  VideoPresets,
  type LocalAudioTrack,
  type LocalVideoTrack,
} from 'livekit-client';
import { Camera, CameraOff, ExternalLink, FileVideo, Pause, Play, Radio, Square } from 'lucide-react';
import { toast } from 'sonner';
import { flag, LANGUAGES, type MatchSummary, type StreamInfo, type StreamToken } from '@d11/shared';
import { LivePill } from '@/components/LivePill';
import { ViewerCount } from '@/components/ViewerCount';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { useStreamRoom } from '@/hooks/useStreamRoom';
import { useReactions } from '@/hooks/useReactions';
import { HypeMeter } from '@/components/player/Reactions';
import { usePoll } from '@/hooks/usePoll';
import { PollControls } from '@/components/poll/PollControls';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, post } from '@/lib/api';
import { cn } from '@/lib/utils';

const selectCls =
  'h-9 w-full rounded-md border border-input bg-surface px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-60';

type CamTracks = { video: LocalVideoTrack; audio: LocalAudioTrack };

export function DashboardPage() {
  const { data: matchData } = useQuery({
    queryKey: ['matches'],
    queryFn: () => api<{ matches: MatchSummary[] }>('/matches'),
  });
  const matches = matchData?.matches ?? [];

  const [title, setTitle] = useState('');
  const [matchId, setMatchId] = useState('');
  const [team, setTeam] = useState('');
  const [language, setLanguage] = useState('English');
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [cam, setCam] = useState<CamTracks | null>(null);
  const [paused, setPaused] = useState(true);
  const [stream, setStream] = useState<StreamInfo | null>(null);

  const fileVideo = useRef<HTMLVideoElement>(null);
  const camVideo = useRef<HTMLVideoElement>(null);
  const room = useRef<Room | null>(null);
  const live = stream?.status === 'live';
  const chat = useStreamRoom(live ? stream.id : undefined);
  const reactions = useReactions(live ? stream.id : undefined);
  const polls = usePoll(live ? stream.id : undefined);

  // Default to the first live match.
  useEffect(() => {
    if (!matchId && matches.length) setMatchId((matches.find((m) => m.status === 'live') ?? matches[0]).id);
  }, [matches, matchId]);
  const match = matches.find((m) => m.id === matchId);

  useEffect(() => {
    if (cam && camVideo.current) cam.video.attach(camVideo.current);
  }, [cam]);

  // Leaving the page while live ends the stream.
  const streamRef = useRef(stream);
  streamRef.current = stream;
  const camRef = useRef(cam);
  camRef.current = cam;
  useEffect(
    () => () => {
      room.current?.disconnect();
      camRef.current?.video.stop();
      camRef.current?.audio.stop();
      if (streamRef.current?.status === 'live') post(`/streams/${streamRef.current.id}/end`).catch(() => {});
    },
    [],
  );

  const toggleCam = async () => {
    if (cam) {
      cam.video.stop();
      cam.audio.stop();
      setCam(null);
      return;
    }
    try {
      const tracks = await createLocalTracks({
        audio: { echoCancellation: true, noiseSuppression: true },
        video: { resolution: VideoPresets.h720.resolution },
      });
      setCam({
        video: tracks.find((t) => t.kind === Track.Kind.Video) as LocalVideoTrack,
        audio: tracks.find((t) => t.kind === Track.Kind.Audio) as LocalAudioTrack,
      });
    } catch (e) {
      toast.error(`Camera unavailable: ${(e as Error).message}`);
    }
  };

  const togglePlay = () => {
    const v = fileVideo.current;
    if (!v) return;
    if (v.paused) v.play();
    else v.pause();
  };

  const goLive = useMutation({
    mutationFn: async () => {
      const res = await post<{ stream: StreamInfo } & StreamToken>('/streams', {
        title,
        matchId,
        supportingTeam: team || undefined,
        language,
      });
      const r = new Room({ adaptiveStream: true, dynacast: true });
      await r.connect(res.url, res.token);
      room.current = r;
      const lp = r.localParticipant;
      const v = fileVideo.current;
      if (fileUrl && v) {
        await v.play(); // captureStream tracks only exist once playback starts
        const ms = (v as HTMLVideoElement & { captureStream(): MediaStream }).captureStream();
        const [vt] = ms.getVideoTracks();
        const [at] = ms.getAudioTracks();
        if (vt) await lp.publishTrack(vt, { source: Track.Source.ScreenShare, name: 'match-video', simulcast: true });
        if (at) await lp.publishTrack(at, { source: Track.Source.ScreenShareAudio, name: 'match-audio' });
      }
      if (cam) {
        await lp.publishTrack(cam.video, { source: Track.Source.Camera });
        await lp.publishTrack(cam.audio, { source: Track.Source.Microphone });
      }
      return res.stream;
    },
    onSuccess: (s) => {
      setStream(s);
      toast.success("You're live!");
    },
    onError: (e) => {
      room.current?.disconnect();
      toast.error(e.message);
    },
  });

  const end = useMutation({
    mutationFn: async () => {
      // Mark ended before leaving the room: viewers refetch the stream when the creator leaves.
      const ended = (await post<{ stream: StreamInfo }>(`/streams/${stream!.id}/end`)).stream;
      // Unpublish without stopping the local camera/mic tracks, so the preview stays on.
      await room.current?.disconnect(false);
      room.current = null;
      fileVideo.current?.pause();
      return ended;
    },
    onSuccess: (s) => {
      setStream(s);
      toast('Stream ended');
    },
  });

  const canGoLive = title.trim() && matchId && (fileUrl || cam) && !goLive.isPending;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold">Creator dashboard</h1>
        {live && <LivePill />}
        {live && <ViewerCount count={chat.viewerCount} />}
        {live && <HypeMeter value={reactions.hype} className="max-w-xs" />}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        {/* Preview: what viewers see (match full size, facecam picture-in-picture) */}
        <section className="space-y-3">
          <div className="relative aspect-video overflow-hidden rounded-2xl bg-ink shadow-lg">
            {fileUrl ? (
              <video
                ref={fileVideo}
                src={fileUrl}
                loop
                playsInline
                onPlay={() => setPaused(false)}
                onPause={() => setPaused(true)}
                className="size-full object-contain"
                data-testid="file-preview"
              />
            ) : (
              <div className="grid size-full place-items-center text-center text-sm text-white/60">
                <div>
                  <FileVideo className="mx-auto mb-2 size-10 opacity-60" />
                  Pick a match video to stream
                </div>
              </div>
            )}
            {cam && (
              <video
                ref={camVideo}
                muted
                playsInline
                className="absolute right-3 bottom-3 aspect-video w-1/4 min-w-28 rounded-lg border-2 border-white/80 object-cover shadow-xl"
              />
            )}
            {live && <LivePill className="absolute top-3 left-3" />}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" asChild>
              <label className="cursor-pointer">
                <FileVideo /> {fileName ? 'Change file' : 'Match video file'}
                <input
                  id="matchFile"
                  type="file"
                  accept="video/*"
                  className="hidden"
                  disabled={live}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    if (fileUrl) URL.revokeObjectURL(fileUrl);
                    setFileUrl(URL.createObjectURL(f));
                    setFileName(f.name);
                  }}
                />
              </label>
            </Button>
            <Button variant={cam ? 'secondary' : 'outline'} onClick={toggleCam} disabled={live} id="camToggle">
              {cam ? <CameraOff /> : <Camera />} {cam ? 'Camera off' : 'Camera + mic'}
            </Button>
            {fileUrl && (
              <Button variant="outline" onClick={togglePlay} aria-label={paused ? 'Play' : 'Pause'}>
                {paused ? <Play /> : <Pause />} {paused ? 'Play' : 'Pause'}
              </Button>
            )}
            {fileName && <span className="truncate text-xs text-muted-foreground">{fileName}</span>}
          </div>
        </section>

        {/* Go-live form, then chat while live */}
        <div className="space-y-5">
          <section className="space-y-4 rounded-2xl bg-surface p-5 shadow-sm">
            <div className="space-y-2">
              <Label htmlFor="title">Stream title</Label>
              <Input
                id="title"
                placeholder="IND vs AUS live reactions 🔥"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={live}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="match">Match</Label>
              <select
                id="match"
                className={selectCls}
                value={matchId}
                disabled={live}
                onChange={(e) => {
                  setMatchId(e.target.value);
                  setTeam('');
                }}
              >
                {matches.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.teamA} vs {m.teamB} · {m.status === 'live' ? 'LIVE' : m.status}
                  </option>
                ))}
              </select>
            </div>
            {match && (
              <div className="space-y-2">
                <Label>Supporting</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[match.teamA, match.teamB, ''].map((t) => (
                    <button
                      key={t || 'neutral'}
                      type="button"
                      disabled={live}
                      onClick={() => setTeam(t)}
                      className={cn(
                        'rounded-lg border-2 px-2 py-1.5 text-sm font-semibold transition active:scale-95',
                        team === t ? 'border-brand bg-accent text-accent-foreground' : 'border-border',
                      )}
                    >
                      {t ? `${flag(t)} ${t}` : 'Neutral'}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <select
                id="language"
                className={selectCls}
                value={language}
                disabled={live}
                onChange={(e) => setLanguage(e.target.value)}
              >
                {LANGUAGES.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </div>

            {live ? (
              <div className="space-y-2">
                <Button variant="outline" asChild className="w-full">
                  <Link to={`/watch/${stream.id}`} target="_blank">
                    <ExternalLink /> Viewer link
                  </Link>
                </Button>
                <Button
                  size="lg"
                  className="w-full bg-ink font-semibold hover:bg-ink/90"
                  onClick={() => end.mutate()}
                  disabled={end.isPending}
                >
                  <Square /> End stream
                </Button>
              </div>
            ) : (
              <Button size="lg" className="w-full font-semibold" disabled={!canGoLive} onClick={() => goLive.mutate()}>
                <Radio /> {goLive.isPending ? 'Connecting…' : 'Go live'}
              </Button>
            )}
            {!live && !(fileUrl || cam) && (
              <p className="text-center text-xs text-muted-foreground">Add a match video, your camera, or both.</p>
            )}
            {stream?.status === 'ended' && (
              <p className="text-center text-xs text-muted-foreground">Last stream ended. Go live again any time.</p>
            )}
          </section>
          {live && <PollControls streamId={stream.id} poll={polls.poll} onPoll={polls.setPoll} />}
          {live && <ChatPanel messages={chat.messages} onSend={chat.send} match={stream.match} className="h-[26rem]" />}
        </div>
      </div>
    </div>
  );
}
