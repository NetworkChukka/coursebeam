'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { LessonStatus } from '@/lib/types';

interface UseProgressTrackingOptions {
  userId: string | null;
  courseId: string;
  lessonId: string;
  duration: number; // seconds, 0 until the player reports it
  isPlaying: boolean;
  getCurrentTime: () => number;
  initialPercentage?: number;
  onLessonCompleted?: () => void;
}

function statusForPercentage(pct: number): LessonStatus {
  if (pct >= 90) return 'completed';
  if (pct > 0) return 'in_progress';
  return 'not_started';
}

/**
 * Polls playback position every few seconds and writes to the `progress` table:
 * - 25% watched  -> first save (in_progress)
 * - 50% / 75%    -> progress updates
 * - 90%          -> marked completed
 * - always       -> last_position_seconds kept current so "Resume" works
 */
export function useProgressTracking({
  userId,
  courseId,
  lessonId,
  duration,
  isPlaying,
  getCurrentTime,
  initialPercentage = 0,
  onLessonCompleted,
}: UseProgressTrackingOptions) {
  const supabase = createClient();
  const [percentage, setPercentage] = useState(initialPercentage);
  const lastSavedThreshold = useRef(Math.floor(initialPercentage / 25) * 25);
  const hasMarkedCompleted = useRef(initialPercentage >= 90);
  const accumulatedWatchSeconds = useRef(0);
  const lastTick = useRef<number | null>(null);

  const persist = useCallback(
    async (pct: number, positionSeconds: number, addWatchSeconds: number) => {
      if (!userId) return; // Not signed in — local state only, nothing to persist.
      const status = statusForPercentage(pct);
      const { error } = await supabase.from('progress').upsert(
        {
          user_id: userId,
          course_id: courseId,
          lesson_id: lessonId,
          status,
          percentage_watched: Math.min(100, Math.round(pct * 100) / 100),
          last_position_seconds: positionSeconds,
          watch_time_seconds: addWatchSeconds,
          completed_at: status === 'completed' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,lesson_id' }
      );
      if (error) console.error('Failed to save progress:', error.message);
    },
    [supabase, userId, courseId, lessonId]
  );

  // Tick every 3s while playing: track watch time and check thresholds.
  useEffect(() => {
    if (!isPlaying || duration <= 0) {
      lastTick.current = null;
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = lastTick.current ? (now - lastTick.current) / 1000 : 0;
      lastTick.current = now;
      accumulatedWatchSeconds.current += elapsed;

      const currentTime = getCurrentTime();
      const pct = Math.min(100, (currentTime / duration) * 100);
      setPercentage(pct);

      const crossedThreshold = Math.floor(pct / 25) * 25;
      const shouldSave = crossedThreshold > lastSavedThreshold.current || (pct >= 90 && !hasMarkedCompleted.current);

      if (shouldSave) {
        lastSavedThreshold.current = Math.max(lastSavedThreshold.current, crossedThreshold);
        if (pct >= 90) hasMarkedCompleted.current = true;
        const watchDelta = accumulatedWatchSeconds.current;
        accumulatedWatchSeconds.current = 0;
        persist(pct, currentTime, watchDelta);
        if (pct >= 90) onLessonCompleted?.();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isPlaying, duration, getCurrentTime, persist, onLessonCompleted]);

  // Always save the exact resume position when the user pauses or leaves the lesson.
  const saveResumePoint = useCallback(() => {
    if (duration <= 0) return;
    const currentTime = getCurrentTime();
    const pct = Math.min(100, (currentTime / duration) * 100);
    const watchDelta = accumulatedWatchSeconds.current;
    accumulatedWatchSeconds.current = 0;
    persist(pct, currentTime, watchDelta);
  }, [duration, getCurrentTime, persist]);

  useEffect(() => {
    if (!isPlaying) saveResumePoint();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      saveResumePoint();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  return { percentage };
}
