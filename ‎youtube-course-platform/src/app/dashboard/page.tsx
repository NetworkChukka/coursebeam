import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ImportForm } from '@/components/ImportForm';
import { CourseCard } from '@/components/CourseCard';
import type { Course } from '@/lib/types';

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/');

  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  const { data: completedRows } = await supabase
    .from('progress')
    .select('course_id')
    .eq('user_id', user.id)
    .eq('status', 'completed');

  const completedByCourse = new Map<string, number>();
  for (const row of completedRows ?? []) {
    completedByCourse.set(row.course_id, (completedByCourse.get(row.course_id) ?? 0) + 1);
  }

  return (
    <div className="space-y-10 pt-10">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="font-display text-2xl font-semibold text-ink">Your courses</h1>
        <ImportForm />
      </div>

      {courses && courses.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(courses as Course[]).map((course) => (
            <CourseCard key={course.id} course={course} completedCount={completedByCourse.get(course.id) ?? 0} />
          ))}
        </div>
      ) : (
        <p className="pt-6 text-center text-sm text-ink-muted">
          No courses yet — paste a playlist link above to get started.
        </p>
      )}
    </div>
  );
}
