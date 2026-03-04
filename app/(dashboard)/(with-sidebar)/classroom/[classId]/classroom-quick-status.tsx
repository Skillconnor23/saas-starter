'use client';

import { useTranslations } from 'next-intl';
import { Calendar, NotebookPen } from 'lucide-react';

type QuickStatusItem = {
  icon: React.ReactNode;
  value: string;
  label: string;
};

type ClassroomQuickStatusProps = {
  nextClass: string | null;
  todoCount: number;
};

export function ClassroomQuickStatus({ nextClass, todoCount }: ClassroomQuickStatusProps) {
  const t = useTranslations('classroom');
  const items: QuickStatusItem[] = [];

  if (nextClass) {
    items.push({
      icon: <Calendar className="h-4 w-4 text-slate-500" />,
      value: nextClass,
      label: t('nextClass'),
    });
  }

  items.push({
    icon: <NotebookPen className="h-4 w-4 text-slate-500" />,
    value: todoCount === 0 ? t('none') : t('pendingCount', { count: todoCount }),
    label: t('todo'),
  });

  return (
    <div className="mb-6 flex flex-wrap gap-3">
      {items.map((item, i) => (
        <div
          key={i}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
        >
          <div className="shrink-0" aria-hidden>
            {item.icon}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#1f2937]">
              {item.value}
            </p>
            <p className="text-xs text-muted-foreground">
              {item.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
