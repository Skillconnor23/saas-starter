import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardCheck } from 'lucide-react';
import { PARTICIPATION_MAX } from '@/lib/constants/attendance';
import { MiniBars } from '@/components/dashboard/MiniBars';

function formatPct(v: number): string {
  return `${Math.round(v * 100)}%`;
}
function formatAvg(v: number | null): string {
  if (v == null) return '—';
  return `${Number(v).toFixed(1)} / ${PARTICIPATION_MAX}`;
}

type StudentSummaryCardProps = {
  attendanceRate: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  participationAvg: number | null;
  detailsHref?: string;
  /** Optional title (e.g. "March 2026"); defaults to "This month". */
  title?: string;
};

export function StudentAttendanceMonthCard({
  attendanceRate,
  presentCount,
  lateCount,
  absentCount,
  participationAvg,
  detailsHref = '/dashboard/attendance',
  title,
}: StudentSummaryCardProps) {
  const heading = title ?? 'This month';
  return (
    <Card className="rounded-2xl border-[#e5e7eb] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardCheck className="h-5 w-5 text-[#429ead]" aria-hidden />
          Attendance — {heading}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xl font-semibold text-[#1f2937]">
          {formatPct(attendanceRate)}
        </p>
        <MiniBars
          presentCount={presentCount}
          lateCount={lateCount}
          absentCount={absentCount}
          aria-label={`Attendance this month: Present ${presentCount}, Late ${lateCount}, Absent ${absentCount}`}
          className="h-16"
        />
        <p className="text-sm text-muted-foreground">
          Participation avg: {formatAvg(participationAvg)}
        </p>
        {detailsHref && (
          <Link
            href={detailsHref}
            className="inline-flex text-sm text-primary hover:underline"
          >
            View details
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

type ClassSummaryCardProps = {
  attendanceRate: number;
  lateRate: number;
  participationAvg: number | null;
  totalSessionsHeld: number;
  detailsHref?: string;
};

export function ClassAttendanceMonthCard({
  attendanceRate,
  lateRate,
  participationAvg,
  totalSessionsHeld,
  detailsHref,
}: ClassSummaryCardProps) {
  return (
    <Card className="rounded-2xl border-[#e5e7eb] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardCheck className="h-5 w-5 text-[#429ead]" aria-hidden />
          This month
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-lg font-semibold text-[#1f2937]">
          Attendance rate: {formatPct(attendanceRate)}
        </p>
        <p className="text-sm text-muted-foreground">
          Late rate: {formatPct(lateRate)}
        </p>
        <p className="text-sm text-muted-foreground">
          Avg participation: {formatAvg(participationAvg)}
        </p>
        <p className="text-sm text-muted-foreground">
          Sessions held: {totalSessionsHeld}
        </p>
        {detailsHref && (
          <Link
            href={detailsHref}
            className="inline-flex text-sm text-primary hover:underline"
          >
            View details
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

type SchoolSummaryCardProps = {
  attendanceRate: number;
  lateRate: number;
  participationAvg: number | null;
  atRiskCount: number;
  detailsHref?: string;
};

export function SchoolAttendanceMonthCard({
  attendanceRate,
  lateRate,
  participationAvg,
  atRiskCount,
  detailsHref = '/dashboard/attendance',
}: SchoolSummaryCardProps) {
  return (
    <Card className="rounded-2xl border-[#e5e7eb] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardCheck className="h-5 w-5 text-[#429ead]" aria-hidden />
          Attendance — This month
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-lg font-semibold text-[#1f2937]">
          Overall: {formatPct(attendanceRate)}
        </p>
        <p className="text-sm text-muted-foreground">
          Late rate: {formatPct(lateRate)}
        </p>
        <p className="text-sm text-muted-foreground">
          Avg participation: {formatAvg(participationAvg)}
        </p>
        <p className="text-sm text-muted-foreground">
          At-risk students: {atRiskCount}
        </p>
        <Link
          href={detailsHref}
          className="inline-flex text-sm text-primary hover:underline"
        >
          View details
        </Link>
      </CardContent>
    </Card>
  );
}
