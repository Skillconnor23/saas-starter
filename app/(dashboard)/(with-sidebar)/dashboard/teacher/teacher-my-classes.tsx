import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, UsersRound } from 'lucide-react';

const DAY_DISPLAY: Record<string, string> = {
  sun: 'Sun', mon: 'Mon', tue: 'Tue', wed: 'Wed',
  thu: 'Thu', fri: 'Fri', sat: 'Sat',
};

function formatScheduleSummary(c: {
  scheduleDays: unknown;
  scheduleStartTime: string | null;
  geckoLevel: string | null;
}): string {
  const days = Array.isArray(c.scheduleDays)
    ? (c.scheduleDays as string[]).map((d) =>
        DAY_DISPLAY[d?.toLowerCase?.().slice(0, 3)] ?? d
      ).filter(Boolean)
    : [];
  const time = c.scheduleStartTime ?? '—';
  const level = c.geckoLevel ?? '';
  const parts = [days.length ? days.join(' & ') : null, time, level].filter(Boolean);
  return parts.join(' · ') || '—';
}

type ClassWithDetails = {
  id: string;
  name: string;
  geckoLevel: string | null;
  scheduleDays: unknown;
  scheduleStartTime: string | null;
  scheduleTimezone: string | null;
  studentCount: number;
  status?: 'on_track' | 'needs_attention';
  avgScore30d: number | null;
  attempts30d: number;
};

type Props = {
  classes: ClassWithDetails[];
};

function ScoreRing({
  score,
  size,
  strokeWidth,
  textClass = 'text-sm',
  days30Label = '30 Days',
}: {
  score: number | null;
  size: number;
  strokeWidth: number;
  textClass?: string;
  days30Label?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = score != null ? (score / 100) * circumference : 0;
  const strokeColor =
    score == null
      ? '#e5e7eb'
      : score >= 80
        ? '#7daf41'
        : score >= 60
          ? '#f59e0b'
          : '#dc2626';

  return (
    <div className="flex flex-col items-center shrink-0">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="overflow-visible -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            className="transition-all duration-300 ease-out"
          />
        </svg>
        <div className={`absolute inset-0 flex items-center justify-center font-semibold text-[#1f2937] ${textClass}`}>
          {score != null ? `${score}%` : '—'}
        </div>
      </div>
      <span className="text-[10px] text-muted-foreground mt-1">{days30Label}</span>
    </div>
  );
}

export async function TeacherMyClasses({ classes }: Props) {
  const t = await getTranslations('teacher.myClasses');
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-[#7daf41]" aria-hidden />
          {t('title')}
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          {t('desc')}
        </p>
      </CardHeader>
      <CardContent>
        {classes.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">
            {t('noClassesYet')}
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {classes.map((c) => (
              <div
                key={c.id}
                className="flex flex-row items-center md:items-start rounded-2xl border border-[#e5e7eb] bg-white p-5 transition-colors hover:border-[#e5e7eb]/80 gap-4 md:gap-5 min-w-0"
              >
                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex items-center gap-2 min-w-0">
                    {c.status && (
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${
                          c.status === 'on_track' ? 'bg-[#7daf41]' : 'bg-amber-500'
                        }`}
                        aria-hidden
                      />
                    )}
                    <h3 className="font-medium text-[#1f2937] truncate">{c.name}</h3>
                  </div>
                  {c.geckoLevel && (
                    <span className="mt-1.5 inline-flex w-fit rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      {c.geckoLevel}
                    </span>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                    {formatScheduleSummary(c)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('studentsCount', { count: c.studentCount })}
                  </p>
                  <div className="mt-4 flex flex-nowrap gap-2">
                  <Button variant="primary" size="sm" asChild>
                    <Link href={`/classroom/${c.id}/people`}>
                      <UsersRound className="mr-1.5 h-4 w-4" />
                      {t('roster')}
                    </Link>
                  </Button>
                  <Button variant="primary" size="sm" asChild>
                    <Link href={`/classroom/${c.id}`}>
                      <BookOpen className="mr-1.5 h-4 w-4" />
                      {t('classroom')}
                    </Link>
                  </Button>
                </div>
                </div>
                <div className="flex shrink-0 items-center md:items-start justify-end md:justify-start ml-0 md:ml-3">
                  <div className="md:hidden">
                    <ScoreRing score={c.avgScore30d} size={68} strokeWidth={6} textClass="text-sm" days30Label={t('days30')} />
                  </div>
                  <div className="hidden md:block">
                    <ScoreRing score={c.avgScore30d} size={80} strokeWidth={7} textClass="text-base" days30Label={t('days30')} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
