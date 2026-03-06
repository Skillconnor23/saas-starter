export const dynamic = 'force-dynamic';

import { requirePermission } from '@/lib/auth/permissions';
import {
  getAdminDashboardStats,
  getAdminNeedsAttention,
} from '@/lib/db/queries/admin-dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  GraduationCap,
  Users,
  Building2,
  BookOpen,
  UserPlus,
  AlertCircle,
  UserCog,
  CalendarDays,
  Plus,
  Activity,
  Heart,
  UserCheck,
  ClipboardCheck,
} from 'lucide-react';

function StatCard({
  label,
  value,
  icon: Icon,
  href,
  iconBg,
  iconColor,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  href?: string;
  iconBg: string;
  iconColor: string;
}) {
  const content = (
    <div className="flex items-start gap-3">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconBg}`}
      >
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-2xl font-semibold tabular-nums tracking-tight text-[#1f2937]">
          {value}
        </p>
        <p className="mt-0.5 text-xs font-medium text-muted-foreground">
          {label}
        </p>
      </div>
    </div>
  );
  return href ? (
    <Link href={href}>
      <Card className="h-full transition-colors hover:border-[#7daf41]/25 hover:shadow-sm">
        <CardContent className="p-4">{content}</CardContent>
      </Card>
    </Link>
  ) : (
    <Card className="h-full">
      <CardContent className="p-4">{content}</CardContent>
    </Card>
  );
}

const PLACEHOLDER = '—';

export default async function AdminDashboardPage() {
  await requirePermission(['classes:read']);

  const [stats, needsAttention] = await Promise.all([
    getAdminDashboardStats(),
    getAdminNeedsAttention(),
  ]);

  const attentionItems: { label: string; count: number; href?: string }[] = [];
  if (needsAttention.classesWithoutTeachers.length > 0) {
    attentionItems.push({
      label: 'Classes without teachers',
      count: needsAttention.classesWithoutTeachers.length,
      href: '/dashboard/admin/classes',
    });
  }
  if (needsAttention.teachersWithNoClasses.length > 0) {
    attentionItems.push({
      label: 'Teachers without active classes',
      count: needsAttention.teachersWithNoClasses.length,
      href: '/dashboard/admin/users/teachers',
    });
  }
  if (stats.pendingInvites > 0) {
    attentionItems.push({
      label: 'Pending invites',
      count: stats.pendingInvites,
    });
  }

  const recentActivityPlaceholder = [
    { type: 'Teacher assigned to class', detail: 'Sarah Chen → Beginner A', time: '2 hours ago' },
    { type: 'Student enrolled', detail: 'Alex Kim joined Intermediate B', time: '5 hours ago' },
    { type: 'Class created', detail: 'Advanced C (Sat)', time: 'Yesterday' },
  ];

  return (
    <section className="flex-1 p-4 lg:p-6">
      <div className="mx-auto w-full max-w-6xl space-y-5">
        {/* Header + Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-[#1f2937]">
              Admin Dashboard
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Monitor platform health and manage schools, users, and classes.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" asChild className="rounded-lg bg-[#7daf41] hover:bg-[#6b9a39]">
              <Link href="/dashboard/admin/schools/new">
                <Plus className="mr-1.5 h-4 w-4" />
                Add School
              </Link>
            </Button>
            <Button size="sm" asChild className="rounded-lg bg-[#7daf41] hover:bg-[#6b9a39]">
              <Link href="/dashboard/admin/classes/new">
                <Plus className="mr-1.5 h-4 w-4" />
                Add Class
              </Link>
            </Button>
            <Button size="sm" asChild className="rounded-lg bg-[#7daf41] hover:bg-[#6b9a39]">
              <Link href="/dashboard/admin/users/teachers">
                <UserCog className="mr-1.5 h-4 w-4" />
                Add Teacher
              </Link>
            </Button>
            <Button size="sm" asChild className="rounded-lg bg-[#7daf41] hover:bg-[#6b9a39]">
              <Link href="/dashboard/admin/users">
                <UserPlus className="mr-1.5 h-4 w-4" />
                Invite User
              </Link>
            </Button>
          </div>
        </div>

        {/* Needs Attention - moved up */}
        {attentionItems.length > 0 && (
          <Card className="border-red-200 bg-red-50/50">
            <CardContent className="flex flex-wrap items-center gap-2 px-4 py-3">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span className="text-sm font-medium text-red-900">Needs attention:</span>
              {attentionItems.map((item) =>
                item.href ? (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-800 transition-colors hover:bg-red-200"
                  >
                    {item.label}
                    <span className="rounded-full bg-red-200 px-1.5 py-0.5 font-semibold">
                      {item.count}
                    </span>
                  </Link>
                ) : (
                  <span
                    key={item.label}
                    className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-800"
                  >
                    {item.label}
                    <span className="rounded-full bg-red-200 px-1.5 py-0.5 font-semibold">
                      {item.count}
                    </span>
                  </span>
                )
              )}
            </CardContent>
          </Card>
        )}

        {/* Platform Overview - 4 cards */}
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Platform Overview
          </h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Total Students"
              value={stats.totalStudents}
              icon={Users}
              href="/dashboard/admin/users/students"
              iconBg="bg-slate-100"
              iconColor="text-slate-600"
            />
            <StatCard
              label="Total Teachers"
              value={stats.totalTeachers}
              icon={GraduationCap}
              href="/dashboard/admin/users/teachers"
              iconBg="bg-slate-100"
              iconColor="text-slate-600"
            />
            <StatCard
              label="Total Schools"
              value={stats.totalSchools}
              icon={Building2}
              href="/dashboard/admin/schools"
              iconBg="bg-slate-100"
              iconColor="text-slate-600"
            />
            <StatCard
              label="Active Classes"
              value={stats.activeClasses}
              icon={BookOpen}
              href="/dashboard/admin/classes"
              iconBg="bg-slate-100"
              iconColor="text-slate-600"
            />
          </div>
        </div>

        {/* Activity Metrics - 4 cards */}
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Activity Metrics
          </h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Lessons This Week"
              value={stats.lessonsThisWeek}
              icon={CalendarDays}
              iconBg="bg-slate-100"
              iconColor="text-slate-600"
            />
            <StatCard
              label="Pending Invites"
              value={stats.pendingInvites}
              icon={UserPlus}
              iconBg="bg-slate-100"
              iconColor="text-slate-600"
            />
            <StatCard
              label="New Students (7 days)"
              value={PLACEHOLDER}
              icon={UserCheck}
              iconBg="bg-slate-100"
              iconColor="text-slate-500"
            />
            <StatCard
              label="Active Teachers Today"
              value={PLACEHOLDER}
              icon={Activity}
              iconBg="bg-slate-100"
              iconColor="text-slate-500"
            />
          </div>
        </div>

        {/* Two columns: Platform Health + Recent Activity */}
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Platform Health */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Heart className="h-4 w-4 text-slate-500" />
                Platform Health
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-semibold tabular-nums text-[#1f2937]">
                    {PLACEHOLDER}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Students active today
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-semibold tabular-nums text-[#1f2937]">
                    {PLACEHOLDER}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Classes running today
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-semibold tabular-nums text-[#1f2937]">
                    {PLACEHOLDER}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Average attendance
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-semibold tabular-nums text-[#1f2937]">
                    {PLACEHOLDER}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Homework completion rate
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Recent Activity</CardTitle>
              <p className="text-xs text-muted-foreground">
                Platform events and changes
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-0 divide-y divide-slate-100">
                {recentActivityPlaceholder.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 px-0 py-3 first:pt-0">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100">
                      <ClipboardCheck className="h-4 w-4 text-slate-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#1f2937]">
                        {item.type}
                      </p>
                      <p className="text-xs text-muted-foreground">{item.detail}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {item.time}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
