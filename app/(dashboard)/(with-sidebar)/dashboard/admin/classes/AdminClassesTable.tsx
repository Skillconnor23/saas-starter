'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { archiveClassAction } from '@/lib/actions/education';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArchiveConfirmModal } from '@/components/archive-confirm-modal';
import { Archive } from 'lucide-react';

type ClassRow = {
  id: string;
  name: string;
  level: string | null;
  timezone: string | null;
};

export function AdminClassesTable({ classes }: { classes: ClassRow[] }) {
  const router = useRouter();
  const [archiveTarget, setArchiveTarget] = useState<ClassRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleArchiveConfirm() {
    if (!archiveTarget) return;
    setLoading(true);
    setError(null);
    const result = await archiveClassAction(archiveTarget.id);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setArchiveTarget(null);
    router.refresh();
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Level</TableHead>
            <TableHead>Timezone</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {classes.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.name}</TableCell>
              <TableCell>{c.level ?? '—'}</TableCell>
              <TableCell>{c.timezone ?? '—'}</TableCell>
              <TableCell className="text-right flex gap-2 justify-end">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/dashboard/admin/classes/${c.id}`}>
                    View
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setArchiveTarget(c)}
                  className="text-red-600 hover:text-red-700 hover:border-red-300"
                >
                  <Archive className="h-4 w-4 mr-1" />
                  Archive
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {archiveTarget && (
        <ArchiveConfirmModal
          title="Archive class?"
          description="Are you sure you want to archive this class? It will be removed from active admin views and should no longer be treated as an active class."
          onClose={() => {
            if (!loading) setArchiveTarget(null);
            setError(null);
          }}
          onConfirm={handleArchiveConfirm}
          loading={loading}
          error={error}
        />
      )}
    </>
  );
}
