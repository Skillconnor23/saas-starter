export const dynamic = 'force-dynamic';

import { getTranslations } from 'next-intl/server';
import { requireRole } from '@/lib/auth/user';
import { getStudentHomeworkList } from '@/lib/actions/homework';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GeckoLoader } from '@/components/ui/gecko-loader';
import { ClipboardList } from 'lucide-react';
import { StudentHomeworkListClient } from './StudentHomeworkListClient';

export default async function StudentHomeworkListPage() {
  const t = await getTranslations('homework');
  const tSidebar = await getTranslations('dashboard.sidebar.student');
  const tList = await getTranslations('homework.listPage');
  await requireRole(['student']);
  const list = await getStudentHomeworkList();
  if (!list) {
    return (
      <section className="flex-1 min-h-[400px]">
        <GeckoLoader minHeight="min-h-[400px]" />
      </section>
    );
  }

  return (
    <section className="flex-1">
      <h1 className="text-xl lg:text-2xl font-medium text-[#1f2937] mb-1 tracking-tight">
        {tSidebar('homework')}
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        {t('viewAndSubmit')}
      </p>

      <Card className="rounded-2xl border border-[#e5e7eb] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-muted-foreground" aria-hidden />
            {tSidebar('homework')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {list.length === 0 ? (
            <div className="py-12 text-center">
              <ClipboardList className="mx-auto h-14 w-14 text-muted-foreground/60 mb-4" aria-hidden />
              <p className="text-muted-foreground font-medium">
                {t('noHomeworkYet')}
              </p>
              <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
                {tList('emptyGuidance')}
              </p>
            </div>
          ) : (
            <StudentHomeworkListClient list={list} />
          )}
        </CardContent>
      </Card>
    </section>
  );
}
