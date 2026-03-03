'use client';

/**
 * Simple 3-bar vertical mini chart for Present / Late / Absent.
 * Uses existing brand colors: green (present), blue (late), brownish-red (absent).
 */
const COLORS = {
  present: '#7daf41', // Gecko green
  late: '#429ead', // brand secondary
  absent: '#b64b29', // brand-warning
} as const;

type MiniBarsProps = {
  presentCount: number;
  lateCount: number;
  absentCount: number;
  /** Optional aria-label for the chart */
  'aria-label'?: string;
  className?: string;
};

export function MiniBars({
  presentCount,
  lateCount,
  absentCount,
  'aria-label': ariaLabel = 'Attendance breakdown: Present, Late, Absent',
  className = '',
}: MiniBarsProps) {
  const max = Math.max(
    1,
    presentCount,
    lateCount,
    absentCount
  );
  const bars = [
    { label: 'Present', count: presentCount, color: COLORS.present },
    { label: 'Late', count: lateCount, color: COLORS.late },
    { label: 'Absent', count: absentCount, color: COLORS.absent },
  ] as const;

  const BAR_AREA_HEIGHT = 48;

  return (
    <div
      className={`flex items-end justify-between gap-2 sm:gap-3 ${className}`}
      role="img"
      aria-label={ariaLabel}
    >
      {bars.map(({ label, count, color }) => {
        const barHeight =
          max > 0
            ? Math.max(2, (count / max) * BAR_AREA_HEIGHT)
            : 0;
        return (
          <div
            key={label}
            className="flex flex-1 flex-col items-center gap-1 min-w-0"
          >
            <div
              className="flex flex-col justify-end w-full rounded-t transition-all duration-300"
              style={{ height: BAR_AREA_HEIGHT }}
              aria-hidden
            >
              <div
                className="w-full rounded-t min-h-[2px]"
                style={{
                  height: barHeight,
                  backgroundColor: color,
                }}
              />
            </div>
            <span className="text-[10px] sm:text-xs font-medium text-muted-foreground truncate w-full text-center">
              {label} {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}
