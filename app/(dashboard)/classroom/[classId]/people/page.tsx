export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { requireClassroomAccess } from '@/lib/auth/classroom';
import { can } from '@/lib/auth/permissions';
import {
  listTeachersByClassId,
  listEnrollmentsByClassId,
} from '@/lib/db/queries/education';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Users } from 'lucide-react';
import type { PlatformRole } from '@/lib/db/schema';
import { PeopleStudentList } from './people-student-list';

type Props = { params: Promise<{ classId: string }> };

function firstName(name: string | null): string {
  if (!name?.trim()) return '—';
  return name.trim().split(/\s+/)[0] ?? '—';
}

function initials(name: string | null, email: string): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
    if (parts.length > 1) return `${parts[0]!.charAt(0)}${parts[parts.length - 1]!.charAt(0)}`.toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

export default async function PeoplePage({ params }: Props) {
  const { classId } = await params;
  const { user, eduClass } = await requireClassroomAccess(classId);

  const [teachersRows, enrollmentsRows] = await Promise.all([
    listTeachersByClassId(classId),
    listEnrollmentsByClassId(classId),
  ]);

  const role = (user.platformRole ?? 'student') as PlatformRole;
  const isAdmin = role === 'admin' || role === 'school_admin';
  const isTeacher = role === 'teacher';
  const isStudent = role === 'student';

  const canManageEnrollments = can(user, 'enrollments:write');

  const students =
    isStudent
      ? enrollmentsRows.filter((r) => r.enrollment.status === 'active')
      : enrollmentsRows;

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mx-auto w-full max-w-4xl px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link
              href={`/classroom/${classId}`}
              className="flex items-center gap-1 text-muted-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to classroom
            </Link>
          </Button>
        </div>

        <div className="mb-6">
          <h1 className="text-lg font-medium">People</h1>
          <p className="text-sm text-muted-foreground">{eduClass.name}</p>
        </div>

        {/* Teachers */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Teachers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {teachersRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No teachers assigned.</p>
            ) : (
              <ul className="space-y-2">
                {teachersRows.map((r) => (
                  <li
                    key={r.teacherUserId}
                    className="flex items-center justify-between gap-3 rounded-lg border bg-muted/20 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {initials(r.teacherName, r.teacherEmail)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">
                        {isStudent ? firstName(r.teacherName) : r.teacherName ?? r.teacherEmail ?? '—'}
                      </span>
                    </div>
                    {isStudent && (
                      <Link
                        href={`/dashboard/messages?start=${r.teacherUserId}`}
                        className="text-sm text-muted-foreground hover:text-primary"
                      >
                        Message
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Students */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              Students
              <span className="text-sm font-normal text-muted-foreground">
                ({students.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PeopleStudentList
              students={students}
              classId={classId}
              role={role}
              canManageEnrollments={canManageEnrollments}
            />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
