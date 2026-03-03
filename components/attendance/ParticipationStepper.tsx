'use client';

import { Minus, Plus } from 'lucide-react';
import { PARTICIPATION_MAX } from '@/lib/constants/attendance';
import { cn } from '@/lib/utils';

type Props = {
  value: number | null;
  onChange: (v: number | null) => void;
  className?: string;
};

export function ParticipationStepper({ value, onChange, className }: Props) {
  const display = value ?? '—';

  function handleDecrement() {
    if (value === null) onChange(0);
    else if (value > 0) onChange(value - 1);
    else onChange(null);
  }

  function handleIncrement() {
    if (value === null) onChange(0);
    else if (value < PARTICIPATION_MAX) onChange(value + 1);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value.trim();
    if (v === '' || v === '—') {
      onChange(null);
      return;
    }
    const n = parseInt(v, 10);
    if (!Number.isNaN(n))
      onChange(Math.min(PARTICIPATION_MAX, Math.max(0, Math.floor(n))));
  }

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md border border-border bg-muted/30',
        className
      )}
    >
      <button
        type="button"
        onClick={handleDecrement}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-l-md text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label="Decrease"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <input
        type="text"
        inputMode="numeric"
        maxLength={1}
        className="h-8 w-9 shrink-0 border-0 bg-transparent text-center text-base tabular-nums focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        value={display}
        onChange={handleInputChange}
        aria-label={`Participation score 0–${PARTICIPATION_MAX}`}
      />
      <button
        type="button"
        onClick={handleIncrement}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-r-md text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label="Increase"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
