export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { requireRole } from '@/lib/auth/user';
import { getScheduleSummaryForUser } from '@/lib/db/queries/education';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, ChevronRight } from 'lucide-react';

export default async function TeacherPeoplePage() {
  const user = await requireRole(['teacher']);
  const t = await getTranslations('teacher.people');
  const classes = await getScheduleSummaryForUser(user.id, 'teacher');

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="text-lg lg:text-2xl font-medium mb-6 flex items-center gap-2">
          <Users className="h-6 w-6" />
          {t('title')}
        </h1>
        <Card>
          <CardHeader>
            <CardTitle>{t('classRosters')}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t('classRostersDesc')}
            </p>
          </CardHeader>
          <CardContent>
            {classes.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                {t('noClassesYet')}
              </p>
            ) : (
              <ul className="space-y-2">
                {classes.map((c) => (
                  <li key={c.id}>
                    <Button variant="outline" className="w-full justify-between" asChild>
                      <Link href={`/classroom/${c.id}/people`}>
                        <span>{c.name}</span>
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
