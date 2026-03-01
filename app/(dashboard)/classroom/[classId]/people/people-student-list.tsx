'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  pauseEnrollmentAction,
  unpauseEnrollmentAction,
  removeEnrollmentAction,
} from '@/lib/actions/education';
import type { PlatformRole } from '@/lib/db/schema';

type EnrollmentRow = {
  enrollment: { status: string; createdAt: Date };
  studentId: number;
  studentEmail: string;
  studentName: string | null;
};

/** First name only (for student privacy view). Fallback to — if no name. */
function firstName(name: string | null): string {
  if (!name?.trim()) return '—';
  return name.trim().split(/\s+/)[0] ?? '—';
}

/** Name or first + last initial (for teacher). Fallback to email if no name. */
function displayNameForTeacher(name: string | null, email: string): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length <= 1) return parts[0]!;
    const last = parts[parts.length - 1]!;
    return `${parts[0]} ${last.charAt(0)}.`;
  }
  return email;
}

/** Initials from name, or first 2 chars of email. */
function initials(name: string | null, email: string): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
    if (parts.length > 1) {
      return `${parts[0]!.charAt(0)}${parts[parts.length - 1]!.charAt(0)}`.toUpperCase();
    }
  }
  return email.slice(0, 2).toUpperCase();
}

function formatJoinedDate(d: Date): string {
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

type Props = {
  students: EnrollmentRow[];
  classId: string;
  role: PlatformRole;
  canManageEnrollments: boolean;
};

export function PeopleStudentList({
  students,
  classId,
  role,
  canManageEnrollments,
}: Props) {
  const isAdmin = role === 'admin' || role === 'school_admin';
  const isTeacher = role === 'teacher';
  const isStudent = role === 'student';

  if (students.length === 0) {
    return <p className="text-sm text-muted-foreground">No students enrolled.</p>;
  }

  return (
    <ul className="space-y-2">
      {students.map((r) => (
        <li
          key={r.studentId}
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/20 p-3"
        >
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {initials(r.studentName, r.studentEmail)}
              </AvatarFallback>
            </Avatar>
            <div>
              <span className="font-medium">
                {isStudent
                  ? firstName(r.studentName)
                  : isTeacher
                    ? displayNameForTeacher(r.studentName, r.studentEmail)
                    : r.studentName ?? r.studentEmail ?? '—'}
              </span>
              {isAdmin && (
                <>
                  {r.studentEmail && (
                    <p className="text-sm text-muted-foreground">{r.studentEmail}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Joined {formatJoinedDate(r.enrollment.createdAt)}
                  </p>
                </>
              )}
            </div>
            {(isTeacher || isAdmin) && (
              <span
                className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${
                  r.enrollment.status === 'active'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : r.enrollment.status === 'paused'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {r.enrollment.status}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isTeacher && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/messages?start=${r.studentId}`}>Message</Link>
              </Button>
            )}
            {(isTeacher || isAdmin) && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/students/${r.studentId}`}>View student</Link>
              </Button>
            )}

            {isAdmin && canManageEnrollments && (
              <>
                {r.enrollment.status === 'active' && (
                  <form action={pauseEnrollmentAction} className="inline">
                    <input type="hidden" name="classId" value={classId} />
                    <input type="hidden" name="studentUserId" value={String(r.studentId)} />
                    <Button type="submit" variant="outline" size="sm">
                      Pause
                    </Button>
                  </form>
                )}
                {r.enrollment.status === 'paused' && (
                  <form
                    action={(fd) => void unpauseEnrollmentAction(fd)}
                    className="inline"
                  >
                    <input type="hidden" name="classId" value={classId} />
                    <input type="hidden" name="studentUserId" value={String(r.studentId)} />
                    <Button type="submit" variant="outline" size="sm">
                      Unpause
                    </Button>
                  </form>
                )}
                {r.enrollment.status !== 'ended' && (
                  <form action={removeEnrollmentAction} className="inline">
                    <input type="hidden" name="classId" value={classId} />
                    <input type="hidden" name="studentUserId" value={String(r.studentId)} />
                    <Button type="submit" variant="outline" size="sm">
                      Remove
                    </Button>
                  </form>
                )}
              </>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
