'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, ClipboardList } from 'lucide-react';
import { saveAttendanceAction } from '@/lib/actions/attendance';
import { PARTICIPATION_MAX } from '@/lib/constants/attendance';
import { AttendanceSegmentedControl } from '@/components/attendance/AttendanceSegmentedControl';
import { ParticipationStepper } from '@/components/attendance/ParticipationStepper';
import { NoteToggleField } from '@/components/attendance/NoteToggleField';
import {
  SessionSelector,
  type SessionWithCompletion,
} from '@/components/attendance/SessionSelector';
import type { AttendanceStatus } from '@/lib/db/schema';

type RosterStudent = {
  studentUserId: number;
  studentName: string | null;
  studentEmail: string;
};

type AttendanceRecordRow = {
  id: string;
  studentUserId: number;
  status: AttendanceStatus;
  participationScore: number | null;
  teacherNote: string | null;
};


type RowState = {
  status: AttendanceStatus;
  participationScore: number | null;
  teacherNote: string;
};

function initials(name: string | null, email: string): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
    if (parts.length > 1)
      return `${parts[0]!.charAt(0)}${parts[parts.length - 1]!.charAt(0)}`.toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

function displayName(name: string | null, email: string): string {
  if (name?.trim()) return name.trim();
  return email;
}

function stateEquals(a: RowState, b: RowState): boolean {
  return (
    a.status === b.status &&
    a.participationScore === b.participationScore &&
    (a.teacherNote ?? '') === (b.teacherNote ?? '')
  );
}

type Props = {
  classId: string;
  sessionId: string;
  eduClassName: string;
  eduClassTimezone?: string | null;
  roster: RosterStudent[];
  records: AttendanceRecordRow[];
  sessions: SessionWithCompletion[];
  isSessionCompleted: boolean;
  rosterCount: number;
};

export function AttendanceForm({
  classId,
  sessionId,
  eduClassName,
  eduClassTimezone,
  roster,
  records,
  sessions,
  isSessionCompleted,
  rosterCount,
}: Props) {
  const router = useRouter();
  const recordMap = useMemo(
    () => new Map(records.map((r) => [r.studentUserId, r])),
    [records]
  );

  function getInitialState(studentUserId: number): RowState {
    const rec = recordMap.get(studentUserId);
    const raw = rec?.participationScore ?? null;
    const participationScore =
      raw != null
        ? Math.min(PARTICIPATION_MAX, Math.max(0, raw))
        : null;
    return {
      status: rec?.status ?? 'present',
      participationScore,
      teacherNote: rec?.teacherNote ?? '',
    };
  }

  const initialStates = useMemo(
    () => new Map(roster.map((r) => [r.studentUserId, getInitialState(r.studentUserId)])),
    [roster, recordMap]
  );

  const [rowStates, setRowStates] = useState<Map<number, RowState>>(() => {
    const m = new Map<number, RowState>();
    roster.forEach((r) => m.set(r.studentUserId, getInitialState(r.studentUserId)));
    return m;
  });

  const [lastParticipation, setLastParticipation] = useState<number | null>(null);

  const [saveStatus, setSaveStatus] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle');

  const isDirty = useMemo(() => {
    for (const r of roster) {
      const current = rowStates.get(r.studentUserId);
      const initial = initialStates.get(r.studentUserId);
      if (!current || !initial) continue;
      if (!stateEquals(current, initial)) return true;
    }
    return false;
  }, [roster, rowStates, initialStates]);

  function updateRow(studentUserId: number, patch: Partial<RowState>) {
    if (patch.participationScore != null) {
      setLastParticipation(patch.participationScore);
    }
    setRowStates((prev) => {
      const next = new Map(prev);
      const cur = next.get(studentUserId) ?? getInitialState(studentUserId);
      next.set(studentUserId, { ...cur, ...patch });
      return next;
    });
  }

  function markAllPresent() {
    setRowStates((prev) => {
      const next = new Map(prev);
      roster.forEach((r) => {
        const cur = next.get(r.studentUserId) ?? getInitialState(r.studentUserId);
        next.set(r.studentUserId, { ...cur, status: 'present' as const });
      });
      return next;
    });
  }

  function clearAll() {
    setRowStates((prev) => {
      const next = new Map(prev);
      roster.forEach((r) => {
        next.set(r.studentUserId, getInitialState(r.studentUserId));
      });
      return next;
    });
  }

  function setAllParticipationToLast() {
    if (lastParticipation == null) return;
    setRowStates((prev) => {
      const next = new Map(prev);
      roster.forEach((r) => {
        const cur = next.get(r.studentUserId) ?? getInitialState(r.studentUserId);
        next.set(r.studentUserId, { ...cur, participationScore: lastParticipation });
      });
      return next;
    });
  }

  async function handleSave() {
    setSaveStatus('saving');
    const rows = roster.map((r) => {
      const state = rowStates.get(r.studentUserId) ?? getInitialState(r.studentUserId);
      return {
        studentUserId: r.studentUserId,
        status: state.status,
        participationScore:
          state.participationScore != null &&
          state.participationScore >= 0 &&
          state.participationScore <= PARTICIPATION_MAX
            ? state.participationScore
            : undefined,
        teacherNote: state.teacherNote.trim() || undefined,
      };
    });

    const formData = new FormData();
    formData.set('classId', classId);
    formData.set('sessionId', sessionId);
    formData.set('rows', JSON.stringify(rows));

    const result = await saveAttendanceAction(null, formData);
    if (result.success) {
      setSaveStatus('saved');
      router.refresh();
      setTimeout(() => setSaveStatus('idle'), 3000);
    } else {
      setSaveStatus('error');
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex flex-col gap-2">
          <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
            <Link
              href={`/classroom/${classId}`}
              className="flex items-center gap-1 text-muted-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to classroom
            </Link>
          </Button>
          <div className="flex flex-col gap-2">
            <div>
              <h1 className="text-lg font-semibold tracking-tight flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Attendance
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {eduClassName}
                {eduClassTimezone && ` · ${eduClassTimezone}`}
              </p>
            </div>
            {sessions.length > 0 && (
              <SessionSelector
                classId={classId}
                sessions={sessions}
                currentSessionId={sessionId}
                classTimezone={eduClassTimezone ?? 'UTC'}
                isCompleted={isSessionCompleted}
                rosterCount={rosterCount}
              />
            )}
          </div>
        </div>
      </div>

      {/* Bulk actions */}
      {roster.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 py-2 border-b border-border">
          <Button variant="outline" size="sm" onClick={markAllPresent}>
            Mark all Present
          </Button>
          <Button variant="outline" size="sm" onClick={clearAll}>
            Clear all
          </Button>
          {lastParticipation != null && (
            <Button
              variant="outline"
              size="sm"
              onClick={setAllParticipationToLast}
            >
              Set participation to {lastParticipation}
            </Button>
          )}
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 min-h-0 overflow-y-auto py-3">
        {roster.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6">
            No students enrolled. Add students from the People page.
          </p>
        ) : (
          <>
            {/* Desktop: table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-base border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-4 font-medium text-muted-foreground text-sm w-[35%]">
                      Student
                    </th>
                    <th className="text-left py-2 px-4 font-medium text-muted-foreground text-sm">
                      Status
                    </th>
                    <th className="text-left py-2 px-4 font-medium text-muted-foreground text-sm w-28">
                      Participation (0–3)
                    </th>
                    <th className="text-left py-2 px-4 font-medium text-muted-foreground text-sm min-w-[240px]">
                      Note
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {roster.map((r) => {
                    const state =
                      rowStates.get(r.studentUserId) ?? getInitialState(r.studentUserId);
                    return (
                      <tr
                        key={r.studentUserId}
                        className="border-b border-border/60 hover:bg-muted/30"
                      >
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="text-sm">
                                {initials(r.studentName, r.studentEmail)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-base truncate">
                              {displayName(r.studentName, r.studentEmail)}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4">
                          <AttendanceSegmentedControl
                            value={state.status}
                            onChange={(v) => updateRow(r.studentUserId, { status: v })}
                          />
                        </td>
                        <td className="py-2.5 px-4">
                          <ParticipationStepper
                            value={state.participationScore}
                            onChange={(v) =>
                              updateRow(r.studentUserId, { participationScore: v })
                            }
                          />
                        </td>
                        <td className="py-2.5 px-4">
                          <NoteToggleField
                            value={state.teacherNote}
                            onChange={(v) =>
                              updateRow(r.studentUserId, { teacherNote: v })
                            }
                            className="min-w-[200px] max-w-full"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile: compact cards */}
            <div className="lg:hidden space-y-2">
              {roster.map((r) => {
                const state =
                  rowStates.get(r.studentUserId) ?? getInitialState(r.studentUserId);
                return (
                  <div
                    key={r.studentUserId}
                    className="rounded-lg border border-border bg-card p-3"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="text-xs">
                          {initials(r.studentName, r.studentEmail)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium truncate flex-1 min-w-0">
                        {displayName(r.studentName, r.studentEmail)}
                      </span>
                      <AttendanceSegmentedControl
                        value={state.status}
                        onChange={(v) => updateRow(r.studentUserId, { status: v })}
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <ParticipationStepper
                        value={state.participationScore}
                        onChange={(v) =>
                          updateRow(r.studentUserId, { participationScore: v })
                        }
                      />
                      <NoteToggleField
                        value={state.teacherNote}
                        onChange={(v) =>
                          updateRow(r.studentUserId, { teacherNote: v })
                        }
                        className="flex-1 min-w-0"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Sticky save bar */}
      <div className="sticky bottom-0 border-t border-border bg-muted/40 py-2.5 backdrop-blur supports-[backdrop-filter]:bg-muted/30">
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm min-w-0 sm:text-base">
            {saveStatus === 'saving' && (
              <span className="text-muted-foreground">Saving…</span>
            )}
            {saveStatus === 'saved' && (
              <span className="font-medium text-brand-primary">Saved</span>
            )}
            {saveStatus === 'error' && (
              <span className="font-medium text-destructive">
                Failed to save. Try again.
              </span>
            )}
            {saveStatus === 'idle' && isDirty && (
              <span className="text-muted-foreground">Unsaved changes</span>
            )}
            {saveStatus === 'idle' && !isDirty && roster.length > 0 && (
              <span className="text-foreground/80">All changes saved</span>
            )}
          </div>
          <Button
            type="button"
            disabled={!isDirty || saveStatus === 'saving' || roster.length === 0}
            onClick={() => void handleSave()}
          >
            {saveStatus === 'saving' ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
}
