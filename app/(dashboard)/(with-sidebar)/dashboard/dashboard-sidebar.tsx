'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Users,
  Settings,
  Shield,
  Activity,
  GraduationCap,
  UserCog,
  Building2,
  LogIn,
  BookOpen,
  BookMarked,
  CalendarDays,
  User,
  MessageSquare,
  X,
} from 'lucide-react';
import type { PlatformRole } from '@/lib/db/schema';
import { useNavDrawer } from '@/app/(dashboard)/layout';

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
        { href: '/dashboard/student/learning', icon: BookOpen, label: 'Learning' },
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
        { href: '/teacher/classes', icon: GraduationCap, label: 'Classes' },
        { href: '/teacher/quizzes', icon: BookOpen, label: 'Quizzes' },
        {
          href: '/dashboard/teacher/learning/flashcards',
          icon: BookMarked,
          label: 'Flashcards',
        },
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
  userName?: string | null;
  userEmail?: string | null;
  userAvatarUrl?: string | null;
};

function userInitials(name: string | null, email: string): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
    return `${parts[0]!.charAt(0)}${parts[parts.length - 1]!.charAt(0)}`.toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

export function DashboardSidebar({
  children,
  platformRole,
  studentPrimaryClassId,
  unreadMessageCount = 0,
  userName,
  userEmail,
  userAvatarUrl,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const { navOpen, setNavOpen } = useNavDrawer();

  useEffect(() => {
    if (!navOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNavOpen(false);
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [navOpen, setNavOpen]);

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
  const isMessages = pathname === '/dashboard/messages';
  const isSchedulePage =
    pathname.startsWith('/dashboard/') && pathname.includes('/schedule');

  function handleNavigate() {
    setNavOpen(false);
  }

  const navContent = (
    <>
      <div className="flex-1 space-y-6 overflow-y-auto">
              {groups.map((group) => (
            <div key={group.label}>
              <h3 className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-white/70 md:text-white/60">
                {group.label}
              </h3>
            <div className="space-y-1">
              {group.items.map((item) => {
                const href = resolveItemHref(item);
                const isActive =
                  pathname === href ||
                  (item.href === '/dashboard/student/learning' &&
                    (pathname?.startsWith('/dashboard/student/learning') ||
                      pathname?.startsWith('/learning'))) ||
                  (item.href === '/teacher/classes' && pathname?.startsWith('/teacher/classes')) ||
                  (item.href === '/teacher/quizzes' && pathname?.startsWith('/teacher/quizzes')) ||
                  (item.href === '/dashboard/teacher/learning/flashcards' &&
                    pathname?.startsWith('/dashboard/teacher/learning/flashcards'));
                const showMessageBadge =
                  item.href === '/dashboard/messages' && unreadMessageCount > 0;
                return (
                  <Link
                    key={`${group.label}-${item.href}`}
                    href={href}
                    onClick={handleNavigate}
                    className="block min-h-[48px] active:opacity-90"
                  >
                    <div
                      className={`flex h-12 min-h-[48px] w-full items-center gap-3 rounded-full px-4 py-3 text-base font-medium text-white transition-colors hover:bg-white/12 active:bg-white/14 md:text-sm md:gap-2 md:px-3 md:py-2 ${
                        isActive ? 'bg-white/25 font-semibold shadow-sm md:bg-white/15' : ''
                      }`}
                    >
                      <item.icon className="h-5 w-5 shrink-0 md:h-4 md:w-4" />
                      <span className="flex-1 text-left">{item.label}</span>
                      {showMessageBadge && (
                        <span
                          className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#b64b29] px-1.5 text-[10px] font-medium text-white"
                          aria-hidden
                        >
                          {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {(userName || userEmail) && (
        <Link
          href="/dashboard/profile"
          className="mt-auto block min-h-[48px] border-t border-white/20 pt-4 group"
        >
          <div className="flex min-h-[48px] items-center gap-3 rounded-full py-2 group-hover:bg-white/10 group-active:bg-white/12 cursor-pointer md:py-0">
            <Avatar className="h-9 w-9 shrink-0 border-2 border-white/30">
              {userAvatarUrl && <AvatarImage src={userAvatarUrl} alt={userName ?? ''} />}
              <AvatarFallback className="bg-white/20 text-sm font-medium text-white">
                {userInitials(userName ?? null, userEmail ?? '')}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-base font-medium text-white md:text-sm">
              {userName?.trim() || userEmail}
            </span>
          </div>
        </Link>
      )}
    </>
  );

  return (
    <div className="flex h-full w-full min-w-0 overflow-hidden">
      {/* Mobile: overlay + off-canvas drawer */}
      {navOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setNavOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar / drawer */}
      <aside
        className={`fixed top-0 left-0 z-50 h-dvh w-[85vw] max-w-[320px] transform bg-[#7daf41] transition-transform duration-200 ease-out md:relative md:left-auto md:top-auto md:z-auto md:h-full md:w-[260px] md:translate-x-0 md:transform-none ${
          navOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex h-full flex-col p-4 sm:p-5">
          {/* Drawer header: X button (mobile only) */}
          <div className="mb-4 flex min-h-[48px] shrink-0 items-center justify-between md:hidden">
            <span className="text-base font-medium text-white">Menu</span>
            <Button
              variant="ghost"
              size="icon"
              className="-mr-2 h-12 min-h-[48px] w-12 min-w-[48px] rounded-full text-white hover:bg-white/10 active:bg-white/14"
              onClick={() => setNavOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
          <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            {navContent}
          </nav>
        </div>
      </aside>

      {/* Main content: column that owns its own scrolling */}
      <main className="min-w-0 flex-1 h-full overflow-hidden">
        {isMessages || isSchedulePage ? (
          <div className="flex h-full w-full flex-col overflow-hidden">
            {children}
          </div>
        ) : (
          <div className="mx-auto flex h-full w-full max-w-6xl flex-col overflow-y-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            {children}
          </div>
        )}
      </main>
    </div>
  );
}
