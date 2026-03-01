export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { getUser } from '@/lib/db/queries';
import {
  getUserById,
  getAllEnrollmentsForStudent,
  isStudentInTeacherClass,
  hasStudentEnrollment,
} from '@/lib/db/queries/education';
import { requirePermission } from '@/lib/auth/permissions';
import type { PlatformRole } from '@/lib/db/schema';

function formatRole(role: string | null): string {
  if (!role) return '—';
  if (role === 'school_admin') return 'School Admin';
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function formatEnrollmentStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

type Props = { params: Promise<{ studentId: string }> };

export default async function StudentProfilePage({ params }: Props) {
  const { studentId } = await params;
  const studentIdNum = parseInt(studentId, 10);
  if (isNaN(studentIdNum) || studentIdNum <= 0) notFound();

  const currentUser = await getUser();
  if (!currentUser) notFound();

  const role = currentUser.platformRole as PlatformRole | null;

  // Permission: admin = any, teacher = only students in their classes, school_admin = allow for now
  if (role === 'admin') {
    await requirePermission(['users:read']);
  } else if (role === 'teacher') {
    await requirePermission(['classes:read']);
    const canView = await isStudentInTeacherClass(currentUser.id, studentIdNum);
    if (!canView) notFound();
  } else if (role === 'school_admin') {
    await requirePermission(['users:read']);
    const canView = await hasStudentEnrollment(studentIdNum);
    if (!canView) notFound();
  } else {
    notFound();
  }

  const [student, enrollments] = await Promise.all([
    getUserById(studentIdNum),
    getAllEnrollmentsForStudent(studentIdNum),
  ]);

  if (!student || (student.platformRole as PlatformRole) !== 'student') {
    notFound();
  }

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mx-auto max-w-2xl">
        <Button variant="ghost" size="sm" asChild>
          <Link
            href={
              role === 'teacher'
                ? '/dashboard/teacher/students'
                : role === 'school_admin'
                  ? '/dashboard/school-admin/students'
                  : '/dashboard/admin/users'
            }
            className="gap-1 text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Users
          </Link>
        </Button>

        <h1 className="mt-6 text-lg font-medium">
          {student.name ?? student.email}
        </h1>

        {role === 'teacher' && (
          <Button variant="outline" size="sm" className="mt-4" asChild>
            <Link href={`/dashboard/messages?start=${student.id}`}>
              Message student
            </Link>
          </Button>
        )}

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-[100px_1fr] gap-2">
              <span className="text-muted-foreground">Name</span>
              <span>{student.name ?? '—'}</span>
              <span className="text-muted-foreground">Email</span>
              <span>{student.email}</span>
              <span className="text-muted-foreground">Role</span>
              <span>{formatRole(student.platformRole)}</span>
              <span className="text-muted-foreground">Timezone</span>
              <span>{student.timezone ?? '—'}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Enrollments</CardTitle>
          </CardHeader>
          <CardContent>
            {enrollments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No enrollments yet.
              </p>
            ) : (
              <ul className="divide-y">
                {enrollments.map(({ enrollment, class: cls }) => (
                  <li
                    key={`${enrollment.classId}-${enrollment.studentUserId}`}
                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                  >
                    <div>
                      <Link
                        href={`/classroom/${cls.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {cls.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        Gecko level: {cls.geckoLevel ?? '—'}
                      </p>
                    </div>
                    <span className="text-sm">
                      {formatEnrollmentStatus(enrollment.status)}
                    </span>
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
