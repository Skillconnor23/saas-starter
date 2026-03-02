import {
  Video,
  NotebookPen,
  FileCheck,
  Megaphone,
  FileText,
  ClipboardList,
  type LucideIcon,
} from 'lucide-react';
import type { ClassroomPostType } from '@/lib/db/schema';

const TYPE_ICON_COLORS: Record<ClassroomPostType, string> = {
  homework: '#ffaa00',
  recording: '#429ead',
  announcement: '#7daf41',
  test: '#64748b',
  document: '#64748b',
  quiz: '#7daf41',
};

const ICON_MAP: Record<ClassroomPostType, LucideIcon> = {
  recording: Video,
  homework: NotebookPen,
  test: FileCheck,
  announcement: Megaphone,
  document: FileText,
  quiz: ClipboardList,
};

export type PostThumbProps = {
  type: ClassroomPostType;
  size?: 'sm' | 'md';
};

const sizeClasses = {
  sm: 'h-14 w-14',
  md: 'h-16 w-16',
} as const;

export function PostThumb({ type, size = 'md' }: PostThumbProps) {
  const Icon = ICON_MAP[type] ?? FileText;
  const boxClass = sizeClasses[size];
  const iconColor = TYPE_ICON_COLORS[type] ?? '#64748b';

  return (
    <div
      className={`flex ${boxClass} shrink-0 items-center justify-center rounded-xl border border-border bg-white`}
      aria-hidden
    >
      <Icon className="h-5 w-5" style={{ color: iconColor }} />
    </div>
  );
}
