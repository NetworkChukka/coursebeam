import Link from 'next/link';
import Image from 'next/image';
import { PlayCircle, ListVideo } from 'lucide-react';
import { ProgressBar } from './ProgressBar';
import type { Course } from '@/lib/types';

interface CourseCardProps {
  course: Course;
  completedCount: number;
}

export function CourseCard({ course, completedCount }: CourseCardProps) {
  const percentage = course.total_videos > 0 ? (completedCount / course.total_videos) * 100 : 0;

  return (
    <Link
      href={`/course/${course.id}`}
      className="group flex flex-col overflow-hidden rounded-xl2 border border-border bg-surface transition hover:border-teal/50 hover:bg-surface-hover"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-bg">
        {course.thumbnail_url && (
          <Image
            src={course.thumbnail_url}
            alt=""
            fill
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
          <PlayCircle size={40} className="text-white" />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 font-display text-sm font-medium leading-snug text-ink">{course.title}</h3>
        <p className="text-xs text-ink-muted">{course.channel_name}</p>
        <div className="mt-auto space-y-1.5 pt-2">
          <div className="flex items-center justify-between text-[11px] text-ink-muted">
            <span className="flex items-center gap-1">
              <ListVideo size={12} />
              {completedCount}/{course.total_videos} lessons
            </span>
            <span className="font-mono">{Math.round(percentage)}%</span>
          </div>
          <ProgressBar percentage={percentage} />
        </div>
      </div>
    </Link>
  );
}
