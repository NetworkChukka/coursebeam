import { cn } from '@/lib/utils';

export function ProgressBar({
  percentage,
  className,
  trackClassName,
}: {
  percentage: number;
  className?: string;
  trackClassName?: string;
}) {
  const clamped = Math.min(100, Math.max(0, percentage));
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-border', trackClassName)}>
      <div
        className={cn('h-full rounded-full bg-teal transition-[width] duration-500', className)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
