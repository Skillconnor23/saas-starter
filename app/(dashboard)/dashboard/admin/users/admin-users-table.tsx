'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import { AssignStudentModal } from './assign-student-modal';
import {
  deactivateUserAction,
  archiveUserAction,
  unarchiveUserAction,
} from '@/lib/actions/education';

type UserRow = {
  id: number;
  name: string | null;
  email: string;
  platformRole: string | null;
  archivedAt: Date | null;
};

type ClassForAssign = {
  id: string;
  name: string;
  geckoLevel: string | null;
  scheduleDays: unknown;
  scheduleStartTime: string | null;
  scheduleTimezone: string | null;
};

function initials(name: string | null): string {
  if (!name?.trim()) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
  return `${parts[0]!.charAt(0)}${parts[parts.length - 1]!.charAt(0)}`.toUpperCase();
}

function formatRole(role: string | null): string {
  if (!role) return '—';
  if (role === 'school_admin') return 'School Admin';
  return role.charAt(0).toUpperCase() + role.slice(1);
}

type Props = {
  users: UserRow[];
  classesCount: Map<number, number>;
  classesForAssign: ClassForAssign[];
  statusFilter: 'active' | 'archived' | 'all';
};

export function AdminUsersTable({
  users,
  classesCount,
  classesForAssign,
  statusFilter,
}: Props) {
  const router = useRouter();
  const [assignTarget, setAssignTarget] = useState<{ ids: number[]; names: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());
  const [archivingIds, setArchivingIds] = useState<Set<number>>(new Set());

  const studentUsers = users.filter((u) => u.platformRole === 'student');
  const studentIds = new Set(studentUsers.map((u) => u.id));
  const selectedStudents = users.filter((u) => selectedIds.has(u.id) && u.platformRole === 'student');

  const isAssigned = (userId: number) => (classesCount.get(userId) ?? 0) >= 1;
  const allSelected = users.length > 0 && users.every((u) => selectedIds.has(u.id));
  const someSelected = selectedIds.size > 0;
  const showUnarchiveBulk = statusFilter === 'archived';
  const showBulkArchive = statusFilter === 'active' || statusFilter === 'all';
  const showBulkUnarchive = statusFilter === 'archived';

  if (users.length === 0) {
    return (
      <p className="py-6 text-sm text-muted-foreground">
        No users match your filters.
      </p>
    );
  }

  function toggleRow(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(users.map((u) => u.id)));
  }

  async function handleArchive(userId: number) {
    if (archivingIds.has(userId)) return;
    const u = users.find((x) => x.id === userId);
    const isArchived = !!u?.archivedAt;
    setArchivingIds((prev) => new Set(prev).add(userId));
    const formData = new FormData();
    formData.set('userId', String(userId));
    const result = isArchived
      ? await unarchiveUserAction(formData)
      : await archiveUserAction(formData);
    setArchivingIds((prev) => {
      const next = new Set(prev);
      next.delete(userId);
      return next;
    });
    if (result?.error) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(userId);
      return next;
    });
    router.refresh();
  }

  async function handleBulkArchive() {
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      const formData = new FormData();
      formData.set('userId', String(id));
      await (showUnarchiveBulk
        ? unarchiveUserAction(formData)
        : archiveUserAction(formData));
    }
    setSelectedIds(new Set());
    setAssignTarget(null);
    router.refresh();
  }

  function handleBulkAssign() {
    const ids = selectedStudents.map((u) => u.id);
    const names = selectedStudents.map((u) => u.name ?? u.email).join(', ');
    setAssignTarget({ ids, names });
  }

  async function handleDelete(userId: number) {
    if (deletingIds.has(userId)) return;
    setDeletingIds((prev) => new Set(prev).add(userId));
    const formData = new FormData();
    formData.set('userId', String(userId));
    const result = await deactivateUserAction(formData);
    setDeletingIds((prev) => {
      const next = new Set(prev);
      next.delete(userId);
      return next;
    });
    if (result?.error) {
      // Could show toast
      return;
    }
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(userId);
      return next;
    });
    router.refresh();
  }

  async function handleBulkDelete() {
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      const formData = new FormData();
      formData.set('userId', String(id));
      await deactivateUserAction(formData);
    }
    setSelectedIds(new Set());
    setAssignTarget(null);
    router.refresh();
  }

  async function handleAssignSuccess() {
    setAssignTarget(null);
    setSelectedIds(new Set());
    router.refresh();
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                aria-label="Select all users"
                className="h-4 w-4 rounded border-input"
              />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Classes</TableHead>
            <TableHead>Assignment</TableHead>
            <TableHead className="w-[160px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => {
            const isStudent = u.platformRole === 'student';
            const assigned = isStudent && isAssigned(u.id);
            return (
              <TableRow key={u.id}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(u.id)}
                    onChange={() => toggleRow(u.id)}
                    aria-label={`Select ${u.name ?? u.email}`}
                    className="h-4 w-4 rounded border-input"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {initials(u.name)}
                      </AvatarFallback>
                    </Avatar>
                    {isStudent ? (
                      <Link
                        href={`/dashboard/students/${u.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {u.name ?? u.email}
                      </Link>
                    ) : (
                      <span className="font-medium">{u.name ?? u.email}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{formatRole(u.platformRole)}</TableCell>
                <TableCell>
                  {isStudent ? classesCount.get(u.id) ?? 0 : '—'}
                </TableCell>
                <TableCell>
                  {isStudent ? (assigned ? 'Assigned' : 'Unassigned') : '—'}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {(u.platformRole === 'teacher' || u.platformRole === 'school_admin') && (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/messages?start=${u.id}`}>
                          Message
                        </Link>
                      </Button>
                    )}
                    {isStudent && !assigned && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setAssignTarget({
                            ids: [u.id],
                            names: u.name ?? u.email,
                          })
                        }
                      >
                        Assign
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleArchive(u.id)}
                      disabled={archivingIds.has(u.id)}
                    >
                      {archivingIds.has(u.id)
                        ? (u.archivedAt ? 'Unarchiving...' : 'Archiving...')
                        : u.archivedAt
                          ? 'Unarchive'
                          : 'Archive'}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(u.id)}
                      disabled={deletingIds.has(u.id)}
                    >
                      {deletingIds.has(u.id) ? 'Deleting...' : 'Delete'}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {someSelected && (
        <div className="mt-4 flex items-center gap-4 rounded-md border bg-muted/50 px-4 py-3">
          <span className="text-sm">
            {selectedIds.size} user{selectedIds.size !== 1 ? 's' : ''} selected
          </span>
          {selectedStudents.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleBulkAssign}>
              Assign to class
            </Button>
          )}
          {(showBulkArchive || showBulkUnarchive) && (
            <Button variant="outline" size="sm" onClick={handleBulkArchive}>
              {showBulkUnarchive ? 'Unarchive' : 'Archive'}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:bg-destructive/10"
            onClick={handleBulkDelete}
          >
            Delete
          </Button>
        </div>
      )}

      {assignTarget && (
        <AssignStudentModal
          studentIds={assignTarget.ids}
          studentNames={assignTarget.names}
          classes={classesForAssign}
          onClose={() => setAssignTarget(null)}
          onSuccess={handleAssignSuccess}
        />
      )}
    </>
  );
}
