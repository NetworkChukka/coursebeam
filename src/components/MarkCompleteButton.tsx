'use client';

import { useState } from 'react';
import { CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useManualCompletionLimit } from '@/hooks/useManualCompletionLimit';
import type { LessonWithProgress } from '@/lib/types';

function formatCountdown(target: Date): string {
  const ms = target.getTime() - Date.now();
  if (ms <= 0) return 'now';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function MarkCompleteButton({
  lesson,
  lessons,
  courseId,
  userId,
  onMarkedComplete,
}: {
  lesson: LessonWithProgress;
  lessons: LessonWithProgress[]; // full ordered lesson list, to enforce sequential order
  courseId: string;
  userId: string | null;
  onMarkedComplete: () => void;
}) {
  const supabase = createClient();
  const { loading, remaining, nextAvailableAt, refresh } = useManualCompletionLimit(userId);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const alreadyCompleted = lesson.progress?.status === 'completed';

  // Sequential rule: every lesson with a lower position must already be completed.
  const earlierIncomplete = lessons.find(
    (l) => l.position < lesson.position && l.progress?.status !== 'completed'
  );
  const isBlockedBySequence = Boolean(earlierIncomplete);

  const isRateLimited = remaining <= 0 && nextAvailableAt !== null;

  if (!userId || alreadyCompleted) return null;

  async function handleClick() {
    if (isRateLimited || isBlockedBySequence) return;
    setSubmitting(true);
    setError(null);

    const { error: progressError } = await supabase.from('progress').upsert(
      {
        user_id: userId,
        course_id: courseId,
        lesson_id: lesson.id,
        status: 'completed',
        percentage_watched: 100,
        last_position_seconds: lesson.duration_seconds,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,lesson_id' }
    );

    if (progressError) {
      setError(progressError.message);
      setSubmitting(false);
      return;
    }

    await supabase.from('manual_completions').insert({ user_id: userId, lesson_id: lesson.id });

    setSubmitting(false);
    refresh();
    onMarkedComplete();
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      <button
        onClick={handleClick}
        disabled={submitting || isRateLimited || isBlockedBySequence || loading}
        className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-ink transition hover:border-teal hover:text-teal disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-ink"
        title={
          isBlockedBySequence
            ? `Finish "${earlierIncomplete?.title}" first`
            : isRateLimited
            ? 'Manual completion limit reached'
            : `${remaining} of 5 manual completions left this window`
        }
      >
        {submitting ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
        Mark as complete
      </button>

      {isRateLimited && nextAvailableAt && (
        <span className="flex items-center gap-1 text-[11px] text-ink-muted">
          <Clock size={11} />
          Try again in {formatCountdown(nextAvailableAt)}
        </span>
      )}
      {isBlockedBySequence && !isRateLimited && (
        <span className="text-[11px] text-ink-muted">Complete lessons in order first.</span>
      )}
      {!isRateLimited && !isBlockedBySequence && (
        <span className="text-[11px] text-ink-muted">{remaining}/5 manual completions left (resets 5h after first use)</span>
      )}
      {error && <span className="text-[11px] text-danger">{error}</span>}
    </div>
  );
}
