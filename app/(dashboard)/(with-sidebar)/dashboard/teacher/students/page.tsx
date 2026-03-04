export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { requireRole } from '@/lib/auth/user';
import {
  getStudentsForTeacher,
  getClassesForTeacherWithDetails,
} from '@/lib/db/queries/education';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Users } from 'lucide-react';
import { TeacherStudentsFilters } from './teacher-students-filters';

function initials(name: string | null, email: string): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
    if (parts.length > 1) return `${parts[0]!.charAt(0)}${parts[parts.length - 1]!.charAt(0)}`.toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

export default async function TeacherStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string; search?: string }>;
}) {
  const user = await requireRole(['teacher']);
  const params = await searchParams;
  const t = await getTranslations('teacher.students');

  const [rows, classesWithDetails] = await Promise.all([
    getStudentsForTeacher(user.id, {
      classId: params.classId || undefined,
      search: params.search || undefined,
    }),
    getClassesForTeacherWithDetails(user.id),
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

        <Card>
          <CardHeader>
            <CardTitle>{t('studentsAcrossClasses')}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t('studentsAcrossDesc')}
            </p>
            <TeacherStudentsFilters
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
                    <TableHead className="text-right">{t('actions')}</TableHead>
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
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/messages?start=${r.studentId}`}>
                            {t('message')}
                          </Link>
                        </Button>
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
