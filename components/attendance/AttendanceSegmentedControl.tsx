'use client';

import { cn } from '@/lib/utils';
import type { AttendanceStatus } from '@/lib/db/schema';

const STATUSES: AttendanceStatus[] = ['present', 'absent', 'late'];

const STATUS_STYLES: Record<AttendanceStatus, string> = {
  present:
    'bg-brand-primary text-white border-brand-primary focus-visible:ring-brand-primary/50',
  late: 'bg-brand-secondary text-white border-brand-secondary focus-visible:ring-brand-secondary/50',
  absent:
    'bg-brand-warning text-white border-brand-warning focus-visible:ring-brand-warning/50',
};

type Props = {
  value: AttendanceStatus;
  onChange: (v: AttendanceStatus) => void;
  className?: string;
};

export function AttendanceSegmentedControl({
  value,
  onChange,
  className,
}: Props) {
  return (
    <div
      role="group"
      aria-label="Attendance status"
      className={cn(
        'inline-flex rounded-full border border-border bg-muted/50 p-1 gap-1',
        className
      )}
    >
      {STATUSES.map((s) => {
        const isSelected = value === s;
        return (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            className={cn(
              'min-h-[38px] min-w-[72px] rounded-full px-3 py-2 text-sm font-medium capitalize transition-colors border focus-visible:outline-none focus-visible:ring-2',
              isSelected
                ? `${STATUS_STYLES[s]} shadow-sm`
                : 'border-transparent bg-transparent text-muted-foreground hover:bg-muted/80 hover:text-foreground'
            )}
          >
            {s}
          </button>
        );
      })}
    </div>
  );
}
