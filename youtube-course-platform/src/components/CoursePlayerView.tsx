'use client';

import { useEffect, useMemo, useState } from 'react';
import { StickyNote, Bookmark as BookmarkIcon } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { VideoPlayer } from './VideoPlayer';
import { NotesPanel } from './NotesPanel';
import { BookmarksPanel } from './BookmarksPanel';
import { ProgressBar } from './ProgressBar';
import { MarkCompleteButton } from './MarkCompleteButton';
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer';
import { useProgressTracking } from '@/hooks/useProgressTracking';
import { usePlayerStore } from '@/store/usePlayerStore';
import { cn, formatDurationLong } from '@/lib/utils';
import type { Course, LessonWithProgress } from '@/lib/types';

export function CoursePlayerView({
  course,
  initialLessons,
  userId,
}: {
  course: Course;
  initialLessons: LessonWithProgress[];
  userId: string | null;
}) {
  const [lessons, setLessons] = useState(initialLessons);
  const [tab, setTab] = useState<'notes' | 'bookmarks'>('notes');
  const { activeLesson, setActiveLesson, autoPlay, playbackRate, setPlaybackRate } = usePlayerStore();

  // Resume: open the most recently-touched in-progress lesson, else the first lesson.
  useEffect(() => {
    if (activeLesson) return;
    const resumeLesson =
      [...initialLessons]
        .filter((l) => l.progress && l.progress.status !== 'completed' && l.progress.percentage_watched > 0)
        .sort((a, b) => (b.progress!.updated_at > a.progress!.updated_at ? 1 : -1))[0] ?? initialLessons[0];
    setActiveLesson(resumeLesson ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentIndex = useMemo(
    () => lessons.findIndex((l) => l.id === activeLesson?.id),
    [lessons, activeLesson]
  );

  const { containerId, isPlaying, duration, getCurrentTime, seekTo, setRate } = useYouTubePlayer({
    videoId: activeLesson?.youtube_video_id ?? '',
    startSeconds: activeLesson?.progress?.last_position_seconds ?? 0,
    autoPlay,
    playbackRate,
    onEnded: () => {
      markCompletedLocally();
      if (autoPlay && currentIndex < lessons.length - 1) setActiveLesson(lessons[currentIndex + 1]);
    },
  });

  const { percentage } = useProgressTracking({
    userId,
    courseId: course.id,
    lessonId: activeLesson?.id ?? '',
    duration,
    isPlaying,
    getCurrentTime,
    initialPercentage: activeLesson?.progress?.percentage_watched ?? 0,
    onLessonCompleted: markCompletedLocally,
  });

  function markCompletedLocally() {
    if (!activeLesson) return;
    setLessons((prev) =>
      prev.map((l) =>
        l.id === activeLesson.id
          ? {
              ...l,
              progress: {
                ...(l.progress ?? {
                  id: '',
                  user_id: userId ?? '',
                  course_id: course.id,
                  lesson_id: l.id,
                  last_position_seconds: 0,
                  watch_time_seconds: 0,
                }),
                status: 'completed',
                percentage_watched: 100,
                completed_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            }
          : l
      )
    );
  }

  function handleJump(lessonId: string, timestampSeconds: number | null) {
    const lesson = lessons.find((l) => l.id === lessonId);
    if (!lesson) return;
    if (lesson.id === activeLesson?.id) {
      if (timestampSeconds !== null) seekTo(timestampSeconds);
    } else {
      setActiveLesson(lesson);
      // Seek once the new player is ready — small delay for the iframe swap.
      if (timestampSeconds !== null) setTimeout(() => seekTo(timestampSeconds), 1200);
    }
  }

  const completedCount = lessons.filter((l) => l.progress?.status === 'completed').length;
  const remainingSeconds = lessons
    .filter((l) => l.progress?.status !== 'completed')
    .reduce((sum, l) => sum + l.duration_seconds, 0);
  const courseProgress = lessons.length > 0 ? (completedCount / lessons.length) * 100 : 0;

  if (!activeLesson) {
    return <p className="pt-10 text-center text-sm text-ink-muted">This course has no lessons yet.</p>;
  }

  return (
    <div className="space-y-5 pt-6">
      <div className="rounded-xl2 border border-border bg-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="font-display text-lg font-semibold text-ink">{course.title}</h1>
          <span className="font-mono text-xs text-ink-muted">
            {completedCount}/{lessons.length} lessons · {formatDurationLong(remainingSeconds)} remaining
          </span>
        </div>
        <div className="mt-2">
          <ProgressBar percentage={courseProgress} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <VideoPlayer
            containerId={containerId}
            percentage={percentage}
            seekTo={seekTo}
            setRate={(rate) => {
              setPlaybackRate(rate);
              setRate(rate);
            }}
            hasPrev={currentIndex > 0}
            hasNext={currentIndex < lessons.length - 1}
            onPrev={() => currentIndex > 0 && setActiveLesson(lessons[currentIndex - 1])}
            onNext={() => currentIndex < lessons.length - 1 && setActiveLesson(lessons[currentIndex + 1])}
          />
          <div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="font-display text-sm font-medium text-ink">{activeLesson.title}</h2>
              <MarkCompleteButton
                lesson={activeLesson}
                lessons={lessons}
                courseId={course.id}
                userId={userId}
                onMarkedComplete={markCompletedLocally}
              />
            </div>
            {activeLesson.description && (
              <p className="mt-1 line-clamp-3 whitespace-pre-line text-xs text-ink-muted">{activeLesson.description}</p>
            )}
          </div>
        </div>

        <div className="flex h-[560px] flex-col gap-3 lg:h-auto">
          <div className="h-64 lg:h-[340px]">
            <Sidebar lessons={lessons} activeLessonId={activeLesson.id} onSelect={setActiveLesson} />
          </div>

          <div className="flex flex-1 flex-col overflow-hidden rounded-xl2 border border-border bg-surface">
            <div className="flex border-b border-border">
              <TabButton active={tab === 'notes'} onClick={() => setTab('notes')} icon={<StickyNote size={13} />}>
                Notes
              </TabButton>
              <TabButton active={tab === 'bookmarks'} onClick={() => setTab('bookmarks')} icon={<BookmarkIcon size={13} />}>
                Bookmarks
              </TabButton>
            </div>
            <div className="flex-1 overflow-hidden">
              {tab === 'notes' ? (
                <NotesPanel lessonId={activeLesson.id} userId={userId} getCurrentTime={getCurrentTime} />
              ) : (
                <BookmarksPanel
                  courseId={course.id}
                  userId={userId}
                  lessons={lessons}
                  activeLessonId={activeLesson.id}
                  getCurrentTime={getCurrentTime}
                  onJump={handleJump}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-1 items-center justify-center gap-1.5 py-2 text-xs font-medium',
        active ? 'border-b-2 border-teal text-ink' : 'text-ink-muted hover:text-ink'
      )}
    >
      {icon}
      {children}
    </button>
  );
}
