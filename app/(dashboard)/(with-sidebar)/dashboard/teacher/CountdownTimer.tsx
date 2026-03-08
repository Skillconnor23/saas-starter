'use client';

import { useEffect, useState } from 'react';

type Props = {
  /** ISO string or Date of target time */
  targetAt: string | Date;
  /** Callback when countdown reaches zero */
  onReachedZero?: () => void;
  className?: string;
};

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return '0:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${minutes}:${pad(seconds)}`;
}

export function CountdownTimer({ targetAt, onReachedZero, className }: Props) {
  const target = typeof targetAt === 'string' ? new Date(targetAt) : targetAt;
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, target.getTime() - Date.now())
  );

  useEffect(() => {
    const tick = () => {
      const ms = Math.max(0, target.getTime() - Date.now());
      setRemaining(ms);
      if (ms <= 0 && onReachedZero) onReachedZero();
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target.getTime(), onReachedZero]);

  return (
    <span className={className} suppressHydrationWarning>
      {formatRemaining(remaining)}
    </span>
  );
}
