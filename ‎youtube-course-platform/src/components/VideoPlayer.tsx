'use client';

import { useEffect } from 'react';
import { SkipBack, SkipForward, Maximize2, Minimize2, Gauge, Repeat } from 'lucide-react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { cn } from '@/lib/utils';

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export function VideoPlayer({
  containerId,
  percentage,
  seekTo,
  setRate,
  hasNext,
  hasPrev,
  onNext,
  onPrev,
}: {
  containerId: string;
  percentage: number;
  seekTo: (seconds: number) => void;
  setRate: (rate: number) => void;
  hasNext: boolean;
  hasPrev: boolean;
  onNext: () => void;
  onPrev: () => void;
}) {
  const { theaterMode, setTheaterMode, autoPlay, setAutoPlay, playbackRate, setPlaybackRate, seekRequest, clearSeekRequest } =
    usePlayerStore();

  // Notes/bookmarks ask the player to jump to a timestamp via the shared store.
  useEffect(() => {
    if (seekRequest !== null) {
      seekTo(seekRequest);
      clearSeekRequest();
    }
  }, [seekRequest, seekTo, clearSeekRequest]);

  return (
    <div className={cn('flex flex-col gap-3', theaterMode && 'fixed inset-0 z-40 justify-center bg-black p-6')}>
      <div className={cn('relative aspect-video w-full overflow-hidden rounded-xl2 bg-black', theaterMode && 'max-h-[80vh] max-w-5xl')}>
        <div id={containerId} className="h-full w-full" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl2 border border-border bg-surface px-4 py-2.5">
        <div className="flex items-center gap-3">
          <button
            onClick={onPrev}
            disabled={!hasPrev}
            className="text-ink-muted hover:text-ink disabled:opacity-30"
            title="Previous lesson"
          >
            <SkipBack size={18} />
          </button>
          <button
            onClick={onNext}
            disabled={!hasNext}
            className="text-ink-muted hover:text-ink disabled:opacity-30"
            title="Next lesson"
          >
            <SkipForward size={18} />
          </button>

          <button
            onClick={() => setAutoPlay(!autoPlay)}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2 py-1 text-xs',
              autoPlay ? 'bg-teal/10 text-teal' : 'text-ink-muted hover:text-ink'
            )}
            title="Toggle autoplay"
          >
            <Repeat size={13} />
            Autoplay
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-ink-muted">
          <span className="font-mono">{Math.round(percentage)}% watched</span>

          <div className="flex items-center gap-1">
            <Gauge size={13} />
            <select
              value={playbackRate}
              onChange={(e) => {
                const rate = Number(e.target.value);
                setPlaybackRate(rate);
                setRate(rate);
              }}
              className="cursor-pointer rounded-md border border-border bg-bg px-1 py-0.5 text-ink outline-none"
            >
              {SPEEDS.map((s) => (
                <option key={s} value={s}>
                  {s}x
                </option>
              ))}
            </select>
          </div>

          <button onClick={() => setTheaterMode(!theaterMode)} className="hover:text-ink" title="Theater mode">
            {theaterMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
