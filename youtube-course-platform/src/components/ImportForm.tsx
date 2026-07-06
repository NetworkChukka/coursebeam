'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Link2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './AuthProvider';
import { AuthModal } from './AuthModal';
import type { ImportedCourse } from '@/lib/types';

export function ImportForm() {
  const { user } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    if (!user) {
      setShowAuth(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/youtube/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data: ImportedCourse | { error: string } = await res.json();
      if (!res.ok || 'error' in data) {
        throw new Error('error' in data ? data.error : 'Import failed.');
      }

      const courseId = await saveCourse(data);
      router.push(`/course/${courseId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  async function saveCourse(imported: ImportedCourse): Promise<string> {
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .insert({
        user_id: user!.id,
        youtube_playlist_id: imported.youtubePlaylistId,
        title: imported.title,
        description: imported.description,
        thumbnail_url: imported.thumbnailUrl,
        channel_name: imported.channelName,
        total_videos: imported.videos.length,
      })
      .select()
      .single();

    if (courseError || !course) throw new Error(courseError?.message ?? 'Could not save course.');

    const { error: lessonsError } = await supabase.from('lessons').insert(
      imported.videos.map((v) => ({
        course_id: course.id,
        youtube_video_id: v.youtubeVideoId,
        title: v.title,
        description: v.description,
        thumbnail_url: v.thumbnailUrl,
        duration_seconds: v.durationSeconds,
        position: v.position,
      }))
    );

    if (lessonsError) throw new Error(lessonsError.message);

    return course.id as string;
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="w-full max-w-xl">
        <div className="flex items-center gap-2 rounded-xl2 border border-border bg-surface p-2 shadow-lg focus-within:border-teal">
          <Link2 size={18} className="ml-2 shrink-0 text-ink-muted" />
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste a YouTube playlist, course, or video URL..."
            className="w-full bg-transparent py-2 text-sm text-ink outline-none placeholder:text-ink-muted"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex shrink-0 items-center gap-2 rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-bg transition hover:bg-teal-dim disabled:opacity-60"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Importing…' : 'Import'}
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-danger">{error}</p>}
      </form>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}
