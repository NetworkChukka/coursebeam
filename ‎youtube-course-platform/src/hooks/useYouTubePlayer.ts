'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

let iframeApiPromise: Promise<void> | null = null;

/** Loads https://www.youtube.com/iframe_api exactly once, however many players are on the page. */
function loadYouTubeIframeApi(): Promise<void> {
  if (window.YT && window.YT.Player) return Promise.resolve();
  if (iframeApiPromise) return iframeApiPromise;

  iframeApiPromise = new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(script);
  });

  return iframeApiPromise;
}

interface UseYouTubePlayerOptions {
  videoId: string;
  startSeconds?: number;
  autoPlay?: boolean;
  playbackRate?: number;
  onEnded?: () => void;
}

export function useYouTubePlayer({ videoId, startSeconds = 0, autoPlay = true, playbackRate = 1, onEnded }: UseYouTubePlayerOptions) {
  const containerId = useRef(`yt-player-${Math.random().toString(36).slice(2)}`).current;
  const playerRef = useRef<YT.Player | null>(null);
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;

  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    let destroyed = false;

    loadYouTubeIframeApi().then(() => {
      if (destroyed) return;
      playerRef.current = new window.YT.Player(containerId, {
        videoId,
        playerVars: {
          autoplay: autoPlay ? 1 : 0,
          start: Math.floor(startSeconds),
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: (event) => {
            setIsReady(true);
            setDuration(event.target.getDuration());
            event.target.setPlaybackRate(playbackRate);
          },
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) setIsPlaying(true);
            if (event.data === window.YT.PlayerState.PAUSED) setIsPlaying(false);
            if (event.data === window.YT.PlayerState.ENDED) {
              setIsPlaying(false);
              onEndedRef.current?.();
            }
          },
        },
      });
    });

    return () => {
      destroyed = true;
      playerRef.current?.destroy();
      playerRef.current = null;
      setIsReady(false);
    };
    // Re-create the player whenever the lesson (videoId) changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, containerId]);

  const getCurrentTime = useCallback(() => playerRef.current?.getCurrentTime() ?? 0, []);
  const seekTo = useCallback((seconds: number) => playerRef.current?.seekTo(seconds, true), []);
  const play = useCallback(() => playerRef.current?.playVideo(), []);
  const pause = useCallback(() => playerRef.current?.pauseVideo(), []);
  const setRate = useCallback((rate: number) => playerRef.current?.setPlaybackRate(rate), []);

  return { containerId, isReady, isPlaying, duration, getCurrentTime, seekTo, play, pause, setRate };
}
