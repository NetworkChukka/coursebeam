import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CoursePlayerView } from '@/components/CoursePlayerView';
import type { Course, Lesson, Progress, LessonWithProgress } from '@/lib/types';

export default async function CoursePage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: course } = await supabase.from('courses').select('*').eq('id', params.id).single();
  if (!course) notFound();

  const { data: lessons } = await supabase
    .from('lessons')
    .select('*')
    .eq('course_id', params.id)
    .order('position', { ascending: true });

  let progressRows: Progress[] = [];
  if (user) {
    const { data } = await supabase.from('progress').select('*').eq('course_id', params.id).eq('user_id', user.id);
    progressRows = data ?? [];
  }

  const lessonsWithProgress: LessonWithProgress[] = (lessons as Lesson[] | null ?? []).map((lesson) => ({
    ...lesson,
    progress: progressRows.find((p) => p.lesson_id === lesson.id),
  }));

  return (
    <CoursePlayerView course={course as Course} initialLessons={lessonsWithProgress} userId={user?.id ?? null} />
  );
}
