'use client';

import { useEffect, useState } from 'react';
import { Bookmark as BookmarkIcon, Trash2, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatDuration } from '@/lib/utils';
import type { Bookmark, LessonWithProgress } from '@/lib/types';

export function BookmarksPanel({
  courseId,
  userId,
  lessons,
  activeLessonId,
  getCurrentTime,
  onJump,
}: {
  courseId: string;
  userId: string | null;
  lessons: LessonWithProgress[];
  activeLessonId: string;
  getCurrentTime: () => number;
  onJump: (lessonId: string, timestampSeconds: number | null) => void;
}) {
  const supabase = createClient();
  const lessonIds = lessons.map((l) => l.id);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  useEffect(() => {
    if (!userId || lessonIds.length === 0) {
      setBookmarks([]);
      return;
    }
    supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)
      .in('lesson_id', lessonIds)
      .order('created_at', { ascending: false })
      .then(({ data }) => setBookmarks(data ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, courseId]);

  async function addTimestampBookmark() {
    if (!userId) return;
    const timestamp_seconds = getCurrentTime();
    const { data, error } = await supabase
      .from('bookmarks')
      .insert({ user_id: userId, lesson_id: activeLessonId, timestamp_seconds })
      .select()
      .single();
    if (!error && data) setBookmarks((prev) => [data, ...prev]);
  }

  async function addLessonBookmark() {
    if (!userId) return;
    const { data, error } = await supabase
      .from('bookmarks')
      .insert({ user_id: userId, lesson_id: activeLessonId, timestamp_seconds: null })
      .select()
      .single();
    if (!error && data) setBookmarks((prev) => [data, ...prev]);
  }

  async function removeBookmark(id: string) {
    const { error } = await supabase.from('bookmarks').delete().eq('id', id);
    if (!error) setBookmarks((prev) => prev.filter((b) => b.id !== id));
  }

  if (!userId) {
    return <p className="p-4 text-center text-xs text-ink-muted">Sign in to save bookmarks.</p>;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex gap-2 border-b border-border p-3">
        <button
          onClick={addTimestampBookmark}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-bg py-1.5 text-xs text-ink hover:border-teal"
        >
          <Plus size={13} /> Bookmark timestamp
        </button>
        <button
          onClick={addLessonBookmark}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-bg py-1.5 text-xs text-ink hover:border-teal"
        >
          <Plus size={13} /> Bookmark lesson
        </button>
      </div>

      <ul className="thin-scroll flex-1 space-y-2 overflow-y-auto p-3">
        {bookmarks.map((bookmark) => {
          const lesson = lessons.find((l) => l.id === bookmark.lesson_id);
          return (
            <li
              key={bookmark.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-border bg-bg p-2.5"
            >
              <button
                onClick={() => onJump(bookmark.lesson_id, bookmark.timestamp_seconds)}
                className="flex min-w-0 items-center gap-2 text-left"
              >
                <BookmarkIcon size={13} className="shrink-0 text-amber" />
                <span className="truncate text-xs text-ink">{lesson?.title ?? 'Lesson'}</span>
                {bookmark.timestamp_seconds !== null && (
                  <span className="shrink-0 font-mono text-[11px] text-ink-muted">
                    {formatDuration(bookmark.timestamp_seconds)}
                  </span>
                )}
              </button>
              <button onClick={() => removeBookmark(bookmark.id)} className="shrink-0 text-ink-muted hover:text-danger">
                <Trash2 size={12} />
              </button>
            </li>
          );
        })}
        {bookmarks.length === 0 && <p className="p-4 text-center text-xs text-ink-muted">No bookmarks yet.</p>}
      </ul>
    </div>
  );
}
