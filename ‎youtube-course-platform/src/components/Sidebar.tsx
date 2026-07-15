'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { CheckCircle2, Circle, PlayCircle, Search, ArrowUpDown } from 'lucide-react';
import { formatDuration, cn } from '@/lib/utils';
import type { LessonWithProgress } from '@/lib/types';

type SortMode = 'course_order' | 'title_az' | 'duration' | 'status';

export function Sidebar({
  lessons,
  activeLessonId,
  onSelect,
}: {
  lessons: LessonWithProgress[];
  activeLessonId: string | null;
  onSelect: (lesson: LessonWithProgress) => void;
}) {
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('course_order');

  const filtered = useMemo(() => {
    let list = lessons;
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((l) => l.title.toLowerCase().includes(q));
    }
    const sorted = [...list];
    if (sortMode === 'title_az') sorted.sort((a, b) => a.title.localeCompare(b.title));
    if (sortMode === 'duration') sorted.sort((a, b) => a.duration_seconds - b.duration_seconds);
    if (sortMode === 'status') {
      const rank = { in_progress: 0, not_started: 1, completed: 2 } as const;
      sorted.sort((a, b) => rank[a.progress?.status ?? 'not_started'] - rank[b.progress?.status ?? 'not_started']);
    }
    if (sortMode === 'course_order') sorted.sort((a, b) => a.position - b.position);
    return sorted;
  }, [lessons, query, sortMode]);

  return (
    <div className="flex h-full flex-col rounded-xl2 border border-border bg-surface">
      <div className="space-y-2 border-b border-border p-3">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-bg px-2.5 py-1.5">
          <Search size={14} className="text-ink-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search lessons..."
            className="w-full bg-transparent text-xs text-ink outline-none placeholder:text-ink-muted"
          />
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-ink-muted">
          <ArrowUpDown size={12} />
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="w-full cursor-pointer rounded-md border border-border bg-bg px-1.5 py-1 text-ink outline-none"
          >
            <option value="course_order">Course order</option>
            <option value="title_az">Title A–Z</option>
            <option value="duration">Duration</option>
            <option value="status">Status</option>
          </select>
        </div>
      </div>

      <ul className="thin-scroll flex-1 overflow-y-auto p-2">
        {filtered.map((lesson, idx) => {
          const isActive = lesson.id === activeLessonId;
          const status = lesson.progress?.status ?? 'not_started';
          return (
            <li key={lesson.id}>
              <button
                onClick={() => onSelect(lesson)}
                className={cn(
                  'flex w-full items-start gap-2.5 rounded-lg p-2 text-left transition',
                  isActive ? 'bg-teal/10 ring-1 ring-teal/40' : 'hover:bg-surface-hover'
                )}
              >
                <div className="relative mt-0.5 h-11 w-16 shrink-0 overflow-hidden rounded-md bg-bg">
                  {lesson.thumbnail_url && (
                    <Image src={lesson.thumbnail_url} alt="" fill className="object-cover" />
                  )}
                  {isActive && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <PlayCircle size={16} className="text-white" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={cn('line-clamp-2 text-xs leading-snug', isActive ? 'text-ink' : 'text-ink-muted')}>
                    {idx + 1}. {lesson.title}
                  </p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <StatusIcon status={status} />
                    <span className="font-mono text-[10px] text-ink-muted">
                      {formatDuration(lesson.duration_seconds)}
                    </span>
                    {status === 'in_progress' && (
                      <span className="font-mono text-[10px] text-teal">
                        {Math.round(lesson.progress?.percentage_watched ?? 0)}%
                      </span>
                    )}
                  </div>
                </div>
              </button>
            </li>
          );
        })}
        {filtered.length === 0 && <p className="p-4 text-center text-xs text-ink-muted">No lessons match.</p>}
      </ul>
    </div>
  );
}

function StatusIcon({ status }: { status: 'not_started' | 'in_progress' | 'completed' }) {
  if (status === 'completed') return <CheckCircle2 size={12} className="text-success" />;
  if (status === 'in_progress') return <Circle size={12} className="fill-teal/30 text-teal" />;
  return <Circle size={12} className="text-ink-muted" />;
}
