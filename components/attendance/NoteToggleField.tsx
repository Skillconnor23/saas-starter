'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
};

export function NoteToggleField({
  value,
  onChange,
  placeholder = 'Add note (optional)',
  className,
}: Props) {
  const [expanded, setExpanded] = useState(!!value.trim());

  const hasNote = !!value.trim();

  return (
    <div className={cn('min-w-0', className)}>
      {expanded ? (
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full min-w-[120px] max-w-full overflow-x-auto whitespace-nowrap rounded-md border border-border bg-muted/30 px-2.5 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring [&::-webkit-scrollbar]:hidden"
            autoFocus
          />
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
          >
            Done
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className={cn(
            'w-full rounded-md border border-dashed px-2.5 py-1.5 text-left text-sm transition-colors truncate',
            hasNote
              ? 'border-border bg-muted/30 text-foreground'
              : 'border-muted-foreground/40 text-muted-foreground hover:border-muted-foreground/60 hover:text-foreground'
          )}
        >
          {hasNote
            ? (value.length > 50 ? `${value.slice(0, 50)}…` : value)
            : placeholder}
        </button>
      )}
    </div>
  );
}
