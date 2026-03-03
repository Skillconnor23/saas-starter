'use client';

/**
 * Lightweight SVG percentage ring (donut) for dashboard cards.
 * Uses stroke-dasharray; no chart library.
 */
const TRACK_COLOR = '#e5e7eb';

type PercentRingProps = {
  /** 0–100 */
  value: number | null;
  /** Outer size in px; ring scales with it */
  size?: number;
  /** Stroke width of the ring */
  strokeWidth?: number;
  /** Fill color for the ring (default: Gecko green) */
  fillColor?: string;
  /** Optional aria-label override */
  'aria-label'?: string;
  className?: string;
};

const DEFAULT_FILL = '#7daf41'; // Gecko green (brand-primary)

export function PercentRing({
  value,
  size = 56,
  strokeWidth = 6,
  fillColor = DEFAULT_FILL,
  'aria-label': ariaLabel,
  className = '',
}: PercentRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = value != null ? Math.min(100, Math.max(0, value)) / 100 : 0;
  const dashOffset = circumference * (1 - progress);

  const label =
    ariaLabel ??
    (value != null ? `Score: ${value} percent` : 'Score not available');

  return (
    <div
      className={`relative shrink-0 ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={label}
    >
      <svg
        width={size}
        height={size}
        className="overflow-visible -rotate-90"
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={TRACK_COLOR}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={value != null ? fillColor : TRACK_COLOR}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-all duration-300 ease-out"
        />
      </svg>
    </div>
  );
}
