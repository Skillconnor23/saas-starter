'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { signOut, clearImpersonateAction, setImpersonateTeacherAction } from '@/app/(login)/actions';
import { mutate } from 'swr';
import { locales } from '@/lib/i18n/config';
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
  LogOut,
  BookOpen,
  BookMarked,
  CalendarDays,
  User,
  MessageSquare,
  X,
  ClipboardList,
  Mail,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import type { PlatformRole } from '@/lib/db/schema';
import { useNavDrawer } from '@/app/(dashboard)/layout';

type NavItem = { href: string; icon: React.ElementType; labelKey: string };

const navGroupKeys: Record<
  PlatformRole,
  { labelKey: string; items: NavItem[] }[]
> = {
  student: [
    {
      labelKey: 'main',
      items: [
        { href: '/dashboard/student', icon: GraduationCap, labelKey: 'dashboard' },
        { href: '__PRIMARY_CLASS__', icon: GraduationCap, labelKey: 'myClassroom' },
        { href: '/dashboard/student/homework', icon: ClipboardList, labelKey: 'homework' },
        { href: '/dashboard/student/learning', icon: BookOpen, labelKey: 'learning' },
        { href: '/dashboard/messages', icon: MessageSquare, labelKey: 'messages' },
        { href: '/dashboard/student/schedule', icon: CalendarDays, labelKey: 'schedule' },
      ],
    },
  ],
  teacher: [
    {
      labelKey: 'main',
      items: [
        { href: '/dashboard/teacher', icon: UserCog, labelKey: 'dashboard' },
        { href: '/teacher/classes', icon: GraduationCap, labelKey: 'classes' },
        {
          href: '/dashboard/teacher/learning-tools',
          icon: BookOpen,
          labelKey: 'learningTools',
        },
        {
          href: '/dashboard/teacher/curriculum/materials',
          icon: BookMarked,
          labelKey: 'curriculum',
        },
        { href: '/dashboard/teacher/students', icon: Users, labelKey: 'students' },
        { href: '/dashboard/teacher/schedule', icon: CalendarDays, labelKey: 'schedule' },
        { href: '/dashboard/homework', icon: ClipboardList, labelKey: 'homework' },
        { href: '/dashboard/messages', icon: MessageSquare, labelKey: 'messages' },
      ],
    },
    {
      labelKey: 'settings',
      items: [
        { href: '/dashboard/profile', icon: User, labelKey: 'profile' },
        { href: '/dashboard/team', icon: Users, labelKey: 'team' },
        { href: '/dashboard/general', icon: Settings, labelKey: 'general' },
        { href: '/dashboard/activity', icon: Activity, labelKey: 'activity' },
        { href: '/dashboard/security', icon: Shield, labelKey: 'security' },
      ],
    },
  ],
  school_admin: [
    {
      labelKey: 'main',
      items: [
        { href: '/dashboard/school-admin', icon: UserCog, labelKey: 'dashboard' },
        { href: '/dashboard/school-admin/school', icon: Building2, labelKey: 'school' },
        { href: '/dashboard/school-admin/students', icon: Users, labelKey: 'students' },
        { href: '/dashboard/school-admin/schedule', icon: CalendarDays, labelKey: 'schedule' },
        { href: '/dashboard/homework', icon: ClipboardList, labelKey: 'homework' },
        { href: '/dashboard/messages', icon: MessageSquare, labelKey: 'messages' },
      ],
    },
  ],
  admin: [
    {
      labelKey: 'main',
      items: [
        { href: '/dashboard/admin', icon: UserCog, labelKey: 'dashboard' },
        { href: '/dashboard/admin/schools', icon: Building2, labelKey: 'schools' },
        { href: '/dashboard/admin/users', icon: Users, labelKey: 'users' },
        { href: '/dashboard/admin/classes', icon: GraduationCap, labelKey: 'classes' },
        { href: '/dashboard/admin/invites', icon: Mail, labelKey: 'invites' },
        { href: '/dashboard/homework', icon: ClipboardList, labelKey: 'homework' },
        { href: '/dashboard/messages', icon: MessageSquare, labelKey: 'messages' },
      ],
    },
    {
      labelKey: 'settings',
      items: [
        { href: '/dashboard/profile', icon: User, labelKey: 'profile' },
        { href: '/dashboard/team', icon: Users, labelKey: 'team' },
        { href: '/dashboard/general', icon: Settings, labelKey: 'general' },
        { href: '/dashboard/activity', icon: Activity, labelKey: 'activity' },
        { href: '/dashboard/security', icon: Shield, labelKey: 'security' },
      ],
    },
  ],
};

type DashboardSidebarProps = {
  children: React.ReactNode;
  platformRole: PlatformRole;
  isImpersonating?: boolean;
  isConnorAsAdmin?: boolean;
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
  isImpersonating = false,
  isConnorAsAdmin = false,
  studentPrimaryClassId,
  unreadMessageCount = 0,
  userName,
  userEmail,
  userAvatarUrl,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const { navOpen, setNavOpen } = useNavDrawer();

  function withLocalePrefix(path: string): string {
    const base = path.startsWith('/') ? path : `/${path}`;
    return `/${locale}${base}`;
  }

  function stripLocaleFromPath(path: string | null): string {
    if (!path) return '/';
    const segments = path.split('/');
    if (segments.length > 1 && locales.includes(segments[1] as any)) {
      return `/${segments.slice(2).join('/')}`.replace(/\/+$/, '') || '/';
    }
    return path;
  }

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
      const base = studentPrimaryClassId
        ? `/classroom/${studentPrimaryClassId}`
        : '/dashboard/student';
      return withLocalePrefix(base);
    }
    if (item.href === '__PEOPLE__') {
      const base = studentPrimaryClassId
        ? `/classroom/${studentPrimaryClassId}/people`
        : '/dashboard/student';
      return withLocalePrefix(base);
    }
    return withLocalePrefix(item.href);
  }

  const sidebarNs = platformRole === 'school_admin' ? 'schoolAdmin' : platformRole;
  const tSidebar = useTranslations('dashboard.sidebar.' + sidebarNs);
  const tNav = useTranslations('nav');
  const groups = navGroupKeys[platformRole] ?? navGroupKeys.student;
  const pathWithoutLocale = stripLocaleFromPath(pathname);

  /**
   * Shared active route matcher. Handles exact match, prefix match, and special cases.
   * - __PRIMARY_CLASS__: active on any /classroom/ path (My Classroom)
   * - Prefix-match items: active when path starts with the match path (nested routes)
   * - Exact-match items: active only when path equals href
   */
  function isNavItemActive(item: NavItem): boolean {
    if (item.href === '__PRIMARY_CLASS__') {
      return pathWithoutLocale.startsWith('/classroom/');
    }
    // Map item href to the path prefix that indicates active (for nested routes)
    const prefixMatchMap: Record<string, string> = {
      '/dashboard/admin/users': '/dashboard/admin/users',
      '/dashboard/admin/invites': '/dashboard/admin/invites',
      '/dashboard/student/learning': '/dashboard/student/learning',
      '/teacher/classes': '/teacher/classes',
      '/dashboard/teacher/learning-tools': '/dashboard/teacher/learning-tools',
      '/dashboard/teacher/curriculum/materials': '/dashboard/teacher/curriculum',
      '/dashboard/student/homework': '/dashboard/student/homework',
      '/dashboard/homework': '/dashboard/homework',
      '/dashboard/messages': '/dashboard/messages',
      '/dashboard/student/schedule': '/dashboard/student/schedule',
      '/dashboard/teacher/schedule': '/dashboard/teacher/schedule',
      '/dashboard/school-admin/schedule': '/dashboard/school-admin/schedule',
      '/dashboard/school-admin/school': '/dashboard/school-admin/school',
      '/dashboard/school-admin/students': '/dashboard/school-admin/students',
    };
    const matchPrefix = prefixMatchMap[item.href];
    if (matchPrefix) {
      return (
        pathWithoutLocale.startsWith(matchPrefix) ||
        (item.href === '/dashboard/student/learning' && pathWithoutLocale.startsWith('/learning'))
      );
    }
    return pathWithoutLocale === item.href;
  }

  function sidebarLabel(labelKey: string): string {
    try {
      const value = tSidebar(labelKey);
      if (typeof value === 'string' && value.length > 0) return value;
    } catch {
      // Missing translation key
    }
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[dashboard-sidebar] Missing translation: dashboard.sidebar.${sidebarNs}.${labelKey}`);
    }
    const segment = labelKey.split('.').pop() ?? labelKey;
    return segment.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).trim();
  }
  const isMessages = pathWithoutLocale === '/dashboard/messages';
  const isSchedulePage =
    pathWithoutLocale.startsWith('/dashboard/') &&
    pathWithoutLocale.includes('/schedule');

  function handleNavigate() {
    setNavOpen(false);
  }

  const navContent = (
    <>
      <div className="flex-1 space-y-6 overflow-y-auto">
              {groups.map((group) => (
            <div key={group.labelKey}>
              <h3 className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-white/70 md:text-white/60">
                {sidebarLabel(group.labelKey)}
              </h3>
            <div className="space-y-1">
              {group.items.map((item) => {
                const href = resolveItemHref(item);
                const isActive = isNavItemActive(item);
                const showMessageBadge =
                  item.href === '/dashboard/messages' && unreadMessageCount > 0;
                return (
                  <Link
                    key={`${group.labelKey}-${item.href}`}
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
                      <span className="flex-1 text-left">{sidebarLabel(item.labelKey)}</span>
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
        <>
          <div className="mt-auto shrink-0 border-t border-white/20 pt-4">
            {(platformRole === 'student' || platformRole === 'school_admin') && (
              <Link
                href={withLocalePrefix(
                  platformRole === 'student'
                    ? '/dashboard/student/settings'
                    : '/dashboard/school-admin/settings'
                )}
                onClick={handleNavigate}
                className={`flex h-12 min-h-[48px] w-full items-center gap-3 rounded-full px-4 py-3 text-base font-medium text-white transition-colors hover:bg-white/12 active:bg-white/14 md:text-sm md:gap-2 md:px-3 md:py-2 ${
                  (platformRole === 'student' &&
                    pathWithoutLocale?.startsWith('/dashboard/student/settings')) ||
                  (platformRole === 'school_admin' &&
                    pathWithoutLocale?.startsWith('/dashboard/school-admin/settings'))
                    ? 'bg-white/25 font-semibold md:bg-white/15'
                    : ''
                }`}
              >
                <Settings className="h-5 w-5 shrink-0 md:h-4 md:w-4" />
                <span className="flex-1 text-left">{tSidebar('settings')}</span>
              </Link>
            )}
            <form
              action={async () => {
                setNavOpen(false);
                await signOut();
                mutate('/api/user');
                router.push(withLocalePrefix('/'));
              }}
              className="pt-2"
            >
              <button
                type="submit"
                className="flex h-12 w-full items-center gap-3 rounded-full px-4 py-3 text-base font-medium text-white transition-colors hover:bg-white/12 active:bg-white/14 md:text-sm md:px-3 md:py-2"
              >
                <LogOut className="h-5 w-5 shrink-0 md:h-4 md:w-4" />
                <span className="flex-1 text-left">{tNav('logout')}</span>
              </button>
            </form>
            <Link
              href={withLocalePrefix('/dashboard/profile')}
              onClick={handleNavigate}
              className="mt-2 block min-h-[48px] group border-t border-white/20 pt-2"
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
          </div>
        </>
      )}
    </>
  );

  return (
    <div className="flex h-full w-full min-w-0 overflow-hidden">
      {/* Mobile: overlay + off-canvas drawer (high z-index so always on top, never trapped) */}
      {navOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/40 md:hidden"
          onClick={() => setNavOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar / drawer */}
      <aside
        className={`fixed top-0 left-0 z-[101] h-dvh w-[85vw] max-w-[320px] transform bg-[#7daf41] transition-transform duration-200 ease-out md:relative md:left-auto md:top-auto md:z-auto md:h-full md:w-[260px] md:translate-x-0 md:transform-none ${
          navOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex h-full flex-col p-4 sm:p-5">
          {/* Drawer header: X button (mobile only) */}
          <div className="mb-4 flex min-h-[48px] shrink-0 items-center justify-between md:hidden">
            <span className="text-base font-medium text-white">{tNav('mobileMenu')}</span>
            <Button
              variant="ghost"
              size="icon"
              className="-mr-2 h-12 min-h-[48px] w-12 min-w-[48px] rounded-full text-white hover:bg-white/10 active:bg-white/14"
              onClick={() => setNavOpen(false)}
              aria-label={tNav('closeMenu')}
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
      <main className="min-w-0 flex-1 h-full overflow-hidden flex flex-col">
        {isConnorAsAdmin && (
          <div className="shrink-0 flex items-center justify-between gap-2 bg-[#b64b29] text-white px-4 py-2 text-sm">
            <span className="font-medium">Viewing as Admin</span>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                const result = await setImpersonateTeacherAction();
                if (result.ok) {
                  router.push(withLocalePrefix(result.redirectTo));
                  setNavOpen(false);
                }
              }}
              className="h-8 rounded-full border-white/30 bg-white/90 text-[#b64b29] hover:bg-white"
            >
              <ArrowRight className="mr-1.5 h-3.5 w-3.5" />
              Switch to Teacher
            </Button>
          </div>
        )}
        {isImpersonating && (
          <div className="shrink-0 flex items-center justify-between gap-2 bg-amber-500/90 text-black px-4 py-2 text-sm">
            <span className="font-medium">Viewing as Teacher</span>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                const { redirectTo } = await clearImpersonateAction();
                router.push(withLocalePrefix(redirectTo));
                setNavOpen(false);
              }}
              className="h-8 rounded-full border-black/30 bg-white/90 text-black hover:bg-white"
            >
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              Return to Admin
            </Button>
          </div>
        )}
        {isMessages || isSchedulePage ? (
          <div className="flex h-full w-full flex-1 flex-col overflow-hidden min-h-0">
            {children}
          </div>
        ) : (
          <div className="mx-auto flex h-full w-full max-w-6xl flex-1 flex-col overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6 min-h-0">
            {children}
          </div>
        )}
      </main>
    </div>
  );
}
