export const dynamic = 'force-dynamic';

import { getTranslations } from 'next-intl/server';
import { requireRole } from '@/lib/auth/user';
import { getClassesWithHealthForTeacher } from '@/lib/db/queries/education';
import { getSessionsNeedingAttendance } from '@/lib/db/queries/teacher-dashboard';
import { TeacherClassCards } from './TeacherClassCards';

export default async function TeacherClassesPage() {
  const user = await requireRole(['teacher']);
  const t = await getTranslations('teacher.classes');
  const [classes, attendanceNeeded] = await Promise.all([
    getClassesWithHealthForTeacher(user.id),
    getSessionsNeedingAttendance(user.id),
  ]);

  const attendanceByClass = new Map(
    attendanceNeeded.map((a) => [a.classId, { sessionId: a.sessionId }])
  );

  return (
    <section className="flex-1 overflow-y-auto p-4 lg:p-6">
      <header className="mb-6">
        <h1 className="text-xl lg:text-2xl font-medium text-[#1f2937] tracking-tight">
          {t('title')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t('subtitle')}
        </p>
      </header>
      <TeacherClassCards
        classes={classes}
        viewerTimezone={user.timezone ?? 'UTC'}
        attendanceNeededByClass={attendanceByClass}
      />
    </section>
  );
}
