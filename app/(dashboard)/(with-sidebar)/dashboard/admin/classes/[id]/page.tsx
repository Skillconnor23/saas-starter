export const dynamic = 'force-dynamic';

import Link from 'next/link';
import {
  getClassById,
  listEnrollmentsByClassId,
  listTeachersByClassId,
} from '@/lib/db/queries/education';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft } from 'lucide-react';
import { AddStudentForm } from './add-student-form';
import { AddTeacherForm } from './add-teacher-form';
import { AssignTeacherSection } from './assign-teacher-section';
import { JoinCodeCard } from './join-code-card';
import { InviteLinkCard } from './invite-link-card';
import { WeeklyScheduleCard } from './WeeklyScheduleCard';
import { getActiveInviteForClassAction } from '@/lib/actions/class-invite';

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const eduClass = await getClassById(id);
  if (!eduClass) notFound();

  const [enrollments, teachers, invite] = await Promise.all([
    listEnrollmentsByClassId(id),
    listTeachersByClassId(id),
    getActiveInviteForClassAction(id),
  ]);

  return (
    <section className="flex-1 p-4 lg:p-8">
      <Link
        href="/dashboard/admin/classes"
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to classes
      </Link>

      <h1 className="text-lg lg:text-2xl font-medium mb-2">{eduClass.name}</h1>
      <p className="text-sm text-muted-foreground mb-6">
        {eduClass.level && <span>{eduClass.level}</span>}
        {eduClass.timezone && <span className="ml-2">• {eduClass.timezone}</span>}
      </p>

      {eduClass.description && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {eduClass.description}
            </p>
          </CardContent>
        </Card>
      )}

      <JoinCodeCard
        classId={id}
        joinCode={eduClass.joinCode}
        joinCodeEnabled={eduClass.joinCodeEnabled}
      />

      <InviteLinkCard classId={id} initialToken={invite?.token ?? null} />

      <div className="mb-6">
        <WeeklyScheduleCard
          classId={id}
          geckoLevel={eduClass.geckoLevel}
          scheduleDays={eduClass.scheduleDays}
          scheduleStartTime={eduClass.scheduleStartTime}
          scheduleTimezone={eduClass.scheduleTimezone}
          scheduleStartDate={eduClass.scheduleStartDate}
          scheduleEndDate={eduClass.scheduleEndDate}
          defaultMeetingUrl={eduClass.defaultMeetingUrl}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Enrollments */}
        <Card>
          <CardHeader>
            <CardTitle>Enrolled students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <AddStudentForm classId={id} />
            </div>
            {enrollments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                No students enrolled.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.map((e) => (
                    <TableRow key={e.enrollment.id}>
                      <TableCell>{e.studentEmail}</TableCell>
                      <TableCell>{e.studentName ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Teachers */}
        <Card>
          <CardHeader>
            <CardTitle>Teachers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {teachers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                No teachers assigned.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teachers.map((t) => (
                    <TableRow key={`${t.classTeacher.classId}-${t.classTeacher.teacherUserId}`}>
                      <TableCell>{t.teacherEmail}</TableCell>
                      <TableCell>{t.teacherName ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <div>
              <p className="text-sm font-medium mb-2">Assign a teacher</p>
              <AssignTeacherSection
                classId={id}
                assignedTeacherIds={teachers.map((t) => t.teacherUserId)}
              />
            </div>
            <div className="border-t pt-4">
              <p className="text-xs text-muted-foreground mb-2">Or add by email</p>
              <AddTeacherForm classId={id} />
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
