import { ImportForm } from '@/components/ImportForm';

export default function HomePage() {
  return (
    <div className="flex min-h-[calc(100vh-56px)] flex-col items-center justify-center gap-6 text-center">
      <span className="rounded-full border border-border bg-surface px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-teal">
        Any playlist. One course.
      </span>
      <h1 className="max-w-2xl font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl">
        Turn a YouTube playlist into a course you'll actually finish
      </h1>
      <p className="max-w-md text-sm text-ink-muted">
        Paste a link. Get a lesson sidebar, resume-where-you-left-off playback, notes, bookmarks,
        and progress tracking — all built in.
      </p>
      <ImportForm />
    </div>
  );
}
