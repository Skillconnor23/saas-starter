'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import type { SchoolAdminClassRow } from '@/lib/db/queries/school-admin-dashboard';

type SortKey = keyof Pick<SchoolAdminClassRow, 'className' | 'studentCount' | 'avgQuizScore30d' | 'attemptRate30d' | 'lastActivityAt'>;

export function SchoolAdminClassTable({ rows }: { rows: SchoolAdminClassRow[] }) {
  const t = useTranslations('schoolAdmin.classTable');
  const [sortKey, setSortKey] = useState<SortKey>('className');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      let va: string | number | Date | null = a[sortKey];
      let vb: string | number | Date | null = b[sortKey];
      if (va === null) return sortDir === 'asc' ? 1 : -1;
      if (vb === null) return sortDir === 'asc' ? -1 : 1;
      if (typeof va === 'string' && typeof vb === 'string') {
        const cmp = va.localeCompare(vb);
        return sortDir === 'asc' ? cmp : -cmp;
      }
      if (va instanceof Date && vb instanceof Date) {
        const cmp = va.getTime() - vb.getTime();
        return sortDir === 'asc' ? cmp : -cmp;
      }
      const cmp = (va as number) - (vb as number);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [rows, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            <button
              onClick={() => toggleSort('className')}
              className="font-medium hover:underline text-left"
            >
              {t('class')}
            </button>
          </TableHead>
          <TableHead>{t('teacher')}</TableHead>
          <TableHead>
            <button
              onClick={() => toggleSort('studentCount')}
              className="font-medium hover:underline text-left"
            >
              {t('students')}
            </button>
          </TableHead>
          <TableHead>
            <button
              onClick={() => toggleSort('avgQuizScore30d')}
              className="font-medium hover:underline text-left"
            >
              {t('avgScore30d')}
            </button>
          </TableHead>
          <TableHead>
            <button
              onClick={() => toggleSort('attemptRate30d')}
              className="font-medium hover:underline text-left"
            >
              {t('attemptRate30d')}
            </button>
          </TableHead>
          <TableHead>
            <button
              onClick={() => toggleSort('lastActivityAt')}
              className="font-medium hover:underline text-left"
            >
              {t('lastActivity')}
            </button>
          </TableHead>
          <TableHead>{t('status')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((r) => (
          <TableRow key={r.classId}>
            <TableCell className="font-medium">
              <Link
                href={`/classroom/${r.classId}`}
                className="text-primary hover:underline"
              >
                {r.className}
              </Link>
            </TableCell>
            <TableCell>{r.teacherName ?? '—'}</TableCell>
            <TableCell>{r.studentCount}</TableCell>
            <TableCell>
              {r.avgQuizScore30d != null ? `${r.avgQuizScore30d}%` : '—'}
            </TableCell>
            <TableCell>{r.attemptRate30d}%</TableCell>
            <TableCell className="text-muted-foreground">
              {r.lastActivityAt
                ? new Date(r.lastActivityAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : '—'}
            </TableCell>
            <TableCell>
              {r.status === 'on_track' ? (
                <span
                  title={t('onTrackTitle')}
                  className="inline-flex text-[#7daf41]"
                  aria-label={t('onTrackAria')}
                >
                  <CheckCircle className="h-5 w-5" />
                </span>
              ) : (
                <span
                  title={t('needsAttentionTitle')}
                  className="inline-flex text-red-500"
                  aria-label={t('needsAttentionAria')}
                >
                  <AlertTriangle className="h-5 w-5" />
                </span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
