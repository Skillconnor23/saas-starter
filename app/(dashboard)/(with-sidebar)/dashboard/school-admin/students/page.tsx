export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { requireRole } from '@/lib/auth/user';
import {
  getStudentsForSchoolAdmin,
  getClassesForSchoolAdminWithDetails,
} from '@/lib/db/queries/education';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Users, BookOpen, UsersRound } from 'lucide-react';
import { SchoolAdminStudentsFilters } from './school-admin-students-filters';

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

function initials(name: string | null, email: string): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
    if (parts.length > 1) return `${parts[0]!.charAt(0)}${parts[parts.length - 1]!.charAt(0)}`.toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

export default async function SchoolAdminStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string; search?: string }>;
}) {
  const user = await requireRole(['school_admin']);
  const params = await searchParams;
  const t = await getTranslations('schoolAdmin.students');

  const [rows, classesWithDetails] = await Promise.all([
    getStudentsForSchoolAdmin({
      classId: params.classId || undefined,
      search: params.search || undefined,
    }),
    getClassesForSchoolAdminWithDetails(),
  ]);

  const classesForFilter = classesWithDetails.map((c) => ({
    id: c.id,
    name: c.name,
  }));

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mx-auto w-full max-w-5xl">
        <h1 className="mb-6 flex items-center gap-2 text-lg font-medium lg:text-2xl">
          <Users className="h-6 w-6" />
          {t('title')}
        </h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('myClasses')}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t('myClassesDesc')}
            </p>
          </CardHeader>
          <CardContent>
            {classesWithDetails.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">
                {t('noClassesYet')}
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {classesWithDetails.map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-col rounded-lg border bg-card p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-medium">{c.name}</h3>
                        {c.geckoLevel && (
                          <span className="mt-1 inline-flex rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                            {c.geckoLevel}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatScheduleSummary(c)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t('studentsCount', { count: c.studentCount })}
                    </p>
                    {c.teachers.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {c.teachers.map((t) => (
                          <div
                            key={t.id}
                            className="flex items-center gap-2 rounded-md border bg-muted/50 px-2 py-1 text-xs"
                          >
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="text-[10px]">
                                {initials(t.name, t.email)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{t.name ?? t.email}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mt-3 flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/classroom/${c.id}/people`}>
                          <UsersRound className="mr-1 h-4 w-4" />
                          {t('roster')}
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/classroom/${c.id}`}>
                          <BookOpen className="mr-1 h-4 w-4" />
                          {t('classroom')}
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('studentsAcrossClasses')}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t('studentsAcrossDesc')}
            </p>
            <SchoolAdminStudentsFilters
              classes={classesForFilter}
              currentParams={params}
            />
          </CardHeader>
          <CardContent>
            {rows.length === 0 ? (
              <p className="py-6 text-sm text-muted-foreground">
                {t('noStudentsMatch')}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('tableStudent')}</TableHead>
                    <TableHead>{t('tableClass')}</TableHead>
                    <TableHead>{t('geckoLevel')}</TableHead>
                    <TableHead>{t('tableStatus')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={`${r.studentId}-${r.classId}`}>
                      <TableCell>
                        <Link
                          href={`/dashboard/students/${r.studentId}`}
                          className="flex items-center gap-3 font-medium text-primary hover:underline"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {initials(r.studentName, r.studentEmail)}
                            </AvatarFallback>
                          </Avatar>
                          {r.studentName ?? r.studentEmail}
                        </Link>
                      </TableCell>
                      <TableCell>{r.className}</TableCell>
                      <TableCell>{r.geckoLevel ?? '—'}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${
                            r.enrollmentStatus === 'active'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : r.enrollmentStatus === 'paused'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                                : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {r.enrollmentStatus === 'active' ? t('statusActive') : r.enrollmentStatus === 'paused' ? t('statusPaused') : r.enrollmentStatus}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
