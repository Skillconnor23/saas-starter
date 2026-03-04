export const dynamic = 'force-dynamic';

import { getTranslations } from 'next-intl/server';
import { requireRole } from '@/lib/auth/user';
import { getClassesWithHealthForTeacher } from '@/lib/db/queries/education';
import { ClassHealthCards } from './ClassHealthCards';

export default async function TeacherClassesPage() {
  const user = await requireRole(['teacher']);
  const t = await getTranslations('teacher.classes');
  const classes = await getClassesWithHealthForTeacher(user.id);

  return (
    <section className="flex-1">
      <h1 className="text-xl lg:text-2xl font-medium text-[#1f2937] mb-2 tracking-tight">
        {t('title')}
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        {t('subtitle')}
      </p>
      <ClassHealthCards classes={classes} />
    </section>
  );
}
