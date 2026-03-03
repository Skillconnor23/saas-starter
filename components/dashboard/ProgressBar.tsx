'use client';

/**
 * Horizontal progress bar for dashboard cards. Gecko green fill, subtle track.
 * Ensures a minimum visible fill (2–3px) when percent is very low.
 */
const TRACK_CLASS = 'bg-[#e5e7eb]';
const FILL_COLOR = '#7daf41'; // Gecko green
const MIN_FILL_PX = 3;

type ProgressBarProps = {
  /** 0–100 */
  value: number;
  /** Optional aria-label */
  'aria-label'?: string;
  className?: string;
};

export function ProgressBar({
  value,
  'aria-label': ariaLabel = 'Progress',
  className = '',
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value));
  const fillPct = pct;
  // Minimum visible fill so very low % still shows a sliver (2–3px)
  const fillStyle = {
    width: `${fillPct}%`,
    minWidth: fillPct > 0 ? `${MIN_FILL_PX}px` : 0,
  };

  return (
    <div
      className={`h-2 w-full rounded-full overflow-hidden ${TRACK_CLASS} ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
    >
      <div
        className="h-full rounded-full transition-all duration-300 ease-out"
        style={{
          ...fillStyle,
          backgroundColor: FILL_COLOR,
        }}
      />
    </div>
  );
}
