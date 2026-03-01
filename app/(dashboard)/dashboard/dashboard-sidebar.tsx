'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Users,
  Settings,
  Shield,
  Activity,
  Menu,
  GraduationCap,
  UserCog,
  Building2,
  LogIn,
  BookOpen,
  CalendarDays,
  User,
  MessageSquare,
} from 'lucide-react';
import type { PlatformRole } from '@/lib/db/schema';

type NavItem = { href: string; icon: React.ElementType; label: string };

const navGroups: Record<
  PlatformRole,
  { label: string; items: NavItem[] }[]
> = {
  student: [
    {
      label: 'Main',
      items: [
        { href: '/dashboard/student', icon: GraduationCap, label: 'Dashboard' },
        { href: '__PRIMARY_CLASS__', icon: BookOpen, label: 'My class' },
        { href: '__PEOPLE__', icon: Users, label: 'People' },
        { href: '/dashboard/student/schedule', icon: CalendarDays, label: 'Schedule' },
        { href: '/dashboard/messages', icon: MessageSquare, label: 'Messages' },
      ],
    },
    {
      label: 'Settings',
      items: [
        { href: '/dashboard/student/join', icon: LogIn, label: 'Join class' },
        { href: '/dashboard/profile', icon: User, label: 'Profile' },
        { href: '/dashboard/activity', icon: Activity, label: 'Activity' },
      ],
    },
  ],
  teacher: [
    {
      label: 'Main',
      items: [
        { href: '/dashboard/teacher', icon: UserCog, label: 'Dashboard' },
        { href: '/dashboard/teacher/students', icon: Users, label: 'Students' },
        { href: '/dashboard/teacher/schedule', icon: CalendarDays, label: 'Schedule' },
        { href: '/dashboard/messages', icon: MessageSquare, label: 'Messages' },
      ],
    },
    {
      label: 'Settings',
      items: [
        { href: '/dashboard/profile', icon: User, label: 'Profile' },
        { href: '/dashboard/team', icon: Users, label: 'Team' },
        { href: '/dashboard/general', icon: Settings, label: 'General' },
        { href: '/dashboard/activity', icon: Activity, label: 'Activity' },
        { href: '/dashboard/security', icon: Shield, label: 'Security' },
      ],
    },
  ],
  school_admin: [
    {
      label: 'Main',
      items: [
        { href: '/dashboard/school-admin', icon: Building2, label: 'Dashboard' },
        { href: '/dashboard/school-admin/students', icon: Users, label: 'Students' },
        { href: '/dashboard/school-admin/schedule', icon: CalendarDays, label: 'Schedule' },
        { href: '/dashboard/admin/classes', icon: GraduationCap, label: 'Classes' },
        { href: '/dashboard/messages', icon: MessageSquare, label: 'Messages' },
      ],
    },
    {
      label: 'Settings',
      items: [
        { href: '/dashboard/profile', icon: User, label: 'Profile' },
        { href: '/dashboard/team', icon: Users, label: 'Team' },
        { href: '/dashboard/general', icon: Settings, label: 'General' },
        { href: '/dashboard/activity', icon: Activity, label: 'Activity' },
        { href: '/dashboard/security', icon: Shield, label: 'Security' },
      ],
    },
  ],
  admin: [
    {
      label: 'Main',
      items: [
        { href: '/dashboard/admin', icon: UserCog, label: 'Dashboard' },
        { href: '/dashboard/admin/users', icon: Users, label: 'Users' },
        { href: '/dashboard/admin/classes', icon: GraduationCap, label: 'Classes' },
        { href: '/dashboard/messages', icon: MessageSquare, label: 'Messages' },
      ],
    },
    {
      label: 'Settings',
      items: [
        { href: '/dashboard/profile', icon: User, label: 'Profile' },
        { href: '/dashboard/team', icon: Users, label: 'Team' },
        { href: '/dashboard/general', icon: Settings, label: 'General' },
        { href: '/dashboard/activity', icon: Activity, label: 'Activity' },
        { href: '/dashboard/security', icon: Shield, label: 'Security' },
      ],
    },
  ],
};

type DashboardSidebarProps = {
  children: React.ReactNode;
  platformRole: PlatformRole;
  studentPrimaryClassId?: string | null;
  unreadMessageCount?: number;
};

export function DashboardSidebar({
  children,
  platformRole,
  studentPrimaryClassId,
  unreadMessageCount = 0,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  function resolveItemHref(item: NavItem): string {
    if (item.href === '__PRIMARY_CLASS__') {
      return studentPrimaryClassId
        ? `/classroom/${studentPrimaryClassId}`
        : '/dashboard/student';
    }
    if (item.href === '__PEOPLE__') {
      return studentPrimaryClassId
        ? `/classroom/${studentPrimaryClassId}/people`
        : '/dashboard/student';
    }
    return item.href;
  }

  const groups = navGroups[platformRole] ?? navGroups.student;

  return (
    <div className="flex flex-col min-h-[calc(100dvh-68px)] max-w-7xl mx-auto w-full">
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between bg-white border-b border-gray-200 p-4">
        <div className="flex items-center">
          <span className="font-medium">Settings</span>
        </div>
        <Button
          className="-mr-3"
          variant="ghost"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden h-full">
        {/* Sidebar */}
        <aside
          className={`w-64 bg-white lg:bg-gray-50 border-r border-gray-200 lg:block ${
            isSidebarOpen ? 'block' : 'hidden'
          } lg:relative absolute inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <nav className="h-full overflow-y-auto p-4 space-y-6">
            {groups.map((group) => (
              <div key={group.label}>
                <h3 className="px-3 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {group.label}
                </h3>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const href = resolveItemHref(item);
                    const isActive = pathname === href;
                    const showMessageBadge =
                      item.href === '/dashboard/messages' && unreadMessageCount > 0;
                    return (
                      <Link key={`${group.label}-${item.href}`} href={href}>
                        <Button
                          variant={isActive ? 'muted' : 'ghost'}
                          className={`shadow-none w-full justify-start ${
                            isActive ? 'bg-gray-100' : ''
                          }`}
                          onClick={() => setIsSidebarOpen(false)}
                        >
                          <item.icon className="h-4 w-4" />
                          {item.label}
                          {showMessageBadge && (
                            <span
                              className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-medium text-destructive-foreground"
                              aria-hidden
                            >
                              {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                            </span>
                          )}
                        </Button>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-0 lg:p-4">{children}</main>
      </div>
    </div>
  );
}
