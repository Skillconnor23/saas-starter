'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { archiveSchoolAction } from '@/lib/actions/schools';
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

type SchoolRow = {
  id: string;
  name: string;
  slug: string;
};

type CountRow = {
  id: string;
  classes: number;
  students: number;
  admins: number;
};

type Props = {
  schools: SchoolRow[];
  countMap: Map<string, CountRow>;
};

export function AdminSchoolsTable({ schools, countMap }: Props) {
  const router = useRouter();
  const [archiveTarget, setArchiveTarget] = useState<SchoolRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleArchiveConfirm() {
    if (!archiveTarget) return;
    setLoading(true);
    setError(null);
    const result = await archiveSchoolAction(archiveTarget.id);
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
            <TableHead>Slug</TableHead>
            <TableHead>Classes</TableHead>
            <TableHead>Students</TableHead>
            <TableHead>School admins</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {schools.map((s) => {
            const c = countMap.get(s.id);
            return (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell className="text-muted-foreground">{s.slug}</TableCell>
                <TableCell>{c?.classes ?? 0}</TableCell>
                <TableCell>{c?.students ?? 0}</TableCell>
                <TableCell>{c?.admins ?? 0}</TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/dashboard/admin/schools/${s.id}`}>
                        Manage
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setArchiveTarget(s)}
                      className="text-red-600 hover:text-red-700 hover:border-red-300"
                    >
                      <Archive className="h-4 w-4 mr-1" />
                      Archive
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {archiveTarget && (
        <ArchiveConfirmModal
          title="Archive school?"
          description="Are you sure you want to archive this school? It will be removed from active admin views and should no longer be treated as an active school."
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
