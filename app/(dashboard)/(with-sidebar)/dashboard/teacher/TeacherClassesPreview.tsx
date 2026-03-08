import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { BookOpen } from 'lucide-react';
import { ClientScheduleSummary } from './ClientScheduleSummary';

type ClassPreview = {
  id: string;
  name: string;
  geckoLevel: string | null;
  scheduleDays: unknown;
  scheduleStartTime: string | null;
  scheduleTimezone: string | null;
  studentCount: number;
};

type Props = {
  classes: ClassPreview[];
  viewerTimezone: string;
  nextSessionRef?: { classId: string; startsAt: Date | string } | null;
};

export async function TeacherClassesPreview({
  classes,
  viewerTimezone,
  nextSessionRef = null,
}: Props) {
  const t = await getTranslations('teacher.myClasses');

  if (classes.length === 0) {
    return (
      <div className="rounded-xl border border-[#e5e7eb] bg-white p-4">
        <h3 className="text-sm font-medium text-[#1f2937]">{t('title')}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t('noClassesYet')}</p>
      </div>
    );
  }

  const displayClasses = classes.slice(0, 4);

  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-[#1f2937]">{t('title')}</h3>
        <Link
          href="/teacher/classes"
          className="text-sm font-medium text-[#429ead] hover:underline"
        >
          {t('viewAllClasses')}
        </Link>
      </div>
      <ul className="mt-3 space-y-2">
        {displayClasses.map((c) => (
          <li key={c.id}>
            <Link
              href={`/classroom/${c.id}`}
              className="group flex items-center justify-between rounded-lg py-1.5 pr-2 transition-colors hover:bg-muted/50"
            >
              <div className="min-w-0 flex-1">
                <span className="font-medium text-[#1f2937] group-hover:text-[#429ead]">
                  {c.name}
                </span>
                {c.geckoLevel && (
                  <span className="ml-2 inline-flex rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                    {c.geckoLevel}
                  </span>
                )}
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  <ClientScheduleSummary
                    classData={{
                      scheduleDays: c.scheduleDays,
                      scheduleStartTime: c.scheduleStartTime,
                      scheduleTimezone: c.scheduleTimezone,
                      geckoLevel: c.geckoLevel,
                    }}
                    serverTimezoneFallback={viewerTimezone}
                    referenceDate={
                      nextSessionRef?.classId === c.id
                        ? nextSessionRef.startsAt
                        : undefined
                    }
                  />
                </p>
              </div>
              <BookOpen className="ml-2 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-[#429ead]" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
