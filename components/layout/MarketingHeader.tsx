'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, Suspense, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Home, LogOut, Menu, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { signOut } from '@/app/(login)/actions';
import { User } from '@/lib/db/schema';
import { NotificationsBell } from '@/components/notifications/NotificationsBell';
import { STUDENT_TRIAL_HREF, SCHOOLS_DEMO_HREF } from '@/lib/routes';
import useSWR, { mutate } from 'swr';
import { LanguageSwitcher } from './LanguageSwitcher';
import { locales, type Locale } from '@/lib/i18n/config';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function stripLocaleFromPath(pathname: string | null): string {
  if (!pathname) return '/';
  const segments = pathname.split('/');
  if (segments.length > 1 && locales.includes(segments[1] as Locale)) {
    return `/${segments.slice(2).join('/')}`.replace(/\/+$/, '') || '/';
  }
  return pathname;
}

function withLocalePrefix(locale: string, path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `/${locale}${normalized}`;
}

function formatRole(platformRole: string | null, tNav: (key: string) => string): string {
  if (!platformRole) return tNav('roleUser');
  if (platformRole === 'school_admin') return tNav('roleSchoolAdmin');
  return platformRole.charAt(0).toUpperCase() + platformRole.slice(1);
}

function NavLink({
  href,
  children,
  isActive,
  muted,
  mobile,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  isActive: boolean;
  muted?: boolean;
  mobile?: boolean;
  onClick?: () => void;
}) {
  const baseColor = isActive ? 'text-[#7daf41]' : muted ? 'text-gray-400' : 'text-gray-700';
  if (mobile) {
    return (
      <Link
        href={href}
        onClick={onClick}
        className={`block px-4 py-3 font-medium transition-colors duration-200 hover:bg-slate-50 hover:text-[#429ead] ${baseColor}`}
      >
        {children}
      </Link>
    );
  }
  return (
    <Link
      href={href}
      className={`hidden md:inline font-medium transition-colors duration-200 hover:text-[#429ead] ${baseColor}`}
    >
      {children}
    </Link>
  );
}

function UserMenu() {
  const tNav = useTranslations('nav');
  const locale = useLocale() as Locale;
  const [mounted, setMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const pathWithoutLocale = stripLocaleFromPath(pathname);
  const { data: user } = useSWR<User>('/api/user', fetcher);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleSignOut() {
    await signOut();
    mutate('/api/user');
    router.push(withLocalePrefix(locale, '/'));
  }

  if (!user) {
    return (
      <>
        <nav className="hidden md:flex items-center gap-8 md:gap-10">
          <NavLink href={withLocalePrefix(locale, '/schools')} isActive={pathWithoutLocale === '/schools'}>
            {tNav('schools')}
          </NavLink>
          <NavLink href={withLocalePrefix(locale, '/academy')} isActive={pathWithoutLocale === '/academy'}>
            {tNav('students')}
          </NavLink>
          <NavLink href={withLocalePrefix(locale, '/pricing')} isActive={pathWithoutLocale === '/pricing'}>
            {tNav('pricing')}
          </NavLink>
          <NavLink href={withLocalePrefix(locale, '/contact')} isActive={pathWithoutLocale === '/contact'}>
            {tNav('contact')}
          </NavLink>
          <NavLink href={withLocalePrefix(locale, '/sign-in')} isActive={pathWithoutLocale === '/sign-in'} muted>
            {tNav('login')}
          </NavLink>
        </nav>
        <Button asChild className="hidden md:inline-flex">
          {pathWithoutLocale === '/schools' ? (
            <Link href={withLocalePrefix(locale, SCHOOLS_DEMO_HREF)}>{tNav('bookDemo')}</Link>
          ) : (
            <Link href={withLocalePrefix(locale, STUDENT_TRIAL_HREF)}>{tNav('startTrial')}</Link>
          )}
        </Button>
      </>
    );
  }

  // Render dropdown only after mount to avoid Radix ID hydration mismatch (client-only)
  if (!mounted) {
    return (
      <div className="flex items-center gap-2 rounded-full bg-transparent px-2 py-1 text-left text-[10px] uppercase tracking-wider text-[#5a5f57]">
        <span className="hidden sm:inline">{formatRole(user.platformRole, tNav)} {tNav('account')}</span>
        <span className="sm:hidden">{tNav('accountShort')}</span>
      </div>
    );
  }

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full bg-transparent px-2 py-1 text-left text-[10px] uppercase tracking-wider text-[#5a5f57] outline-none hover:bg-[#f3f4f6]">
        <span className="hidden sm:inline">
          {formatRole(user.platformRole, tNav)} {tNav('account')}
        </span>
        <span className="sm:hidden">{tNav('accountShort')}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="flex flex-col gap-1">
        <DropdownMenuItem className="cursor-pointer">
          <Link href={withLocalePrefix(locale, '/dashboard')} className="flex w-full items-center">
            <Home className="mr-2 h-4 w-4" />
            <span>{tNav('dashboard')}</span>
          </Link>
        </DropdownMenuItem>
        <form action={handleSignOut} className="w-full">
          <button type="submit" className="flex w-full">
            <DropdownMenuItem className="w-full flex-1 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>{tNav('logout')}</span>
            </DropdownMenuItem>
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Header for marketing and app: logo (→ /), nav, user menu. showSidebarToggle for app routes. */
export function MarketingHeader({
  showSidebarToggle = false,
  onMenuClick
}: {
  showSidebarToggle?: boolean;
  onMenuClick?: () => void;
}) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const pathWithoutLocale = useMemo(() => stripLocaleFromPath(pathname), [pathname]);
  const tNav = useTranslations('nav');
  const { data: user } = useSWR<User>('/api/user', fetcher);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="relative w-full border-b border-gray-200 bg-white shrink-0">
      <div className="flex h-16 w-full items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-3 md:flex-initial">
          {showSidebarToggle && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden -ml-2 h-12 min-h-[48px] w-12 min-w-[48px] shrink-0 rounded-full text-[#1f2937] hover:bg-[#f3f4f6] active:bg-[#e5e7eb]"
              onClick={onMenuClick}
              aria-label={tNav('openMenu')}
            >
              <Menu className="h-6 w-6" />
            </Button>
          )}
          <Link href={withLocalePrefix(locale, '/')} className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full">
              <Image
                src="/gecko-logo.svg"
                alt=""
                width={120}
                height={120}
                sizes="(max-width: 768px) 40px, 40px"
                className="h-10 w-10 object-contain"
                unoptimized
                priority
              />
            </div>
            <span className="text-lg font-semibold leading-none text-[#3d4236] sm:text-xl">
              {tNav('brand')}
            </span>
          </Link>
          <div className="ml-3 hidden items-center md:flex">
            <LanguageSwitcher />
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2 shrink-0">
          <NotificationsBell />
          <div className="hidden md:flex items-center gap-2">
            <Suspense fallback={<div className="h-9" />}>
              <UserMenu />
            </Suspense>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-10 w-10 shrink-0 rounded-full text-[#1f2937] hover:bg-[#f3f4f6]"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label={mobileMenuOpen ? tNav('closeMenu') : tNav('openMenu')}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>
      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="absolute left-0 right-0 top-16 z-50 md:hidden w-full bg-white py-2 shadow-lg">
          <div className="flex w-full items-center justify-between px-4 pb-2">
            <LanguageSwitcher />
          </div>
          {!user ? (
            <>
              <NavLink
                href={withLocalePrefix(locale, '/schools')}
                isActive={pathWithoutLocale === '/schools'}
                mobile
                onClick={() => setMobileMenuOpen(false)}
              >
                {tNav('schools')}
              </NavLink>
              <NavLink
                href={withLocalePrefix(locale, '/academy')}
                isActive={pathWithoutLocale === '/academy'}
                mobile
                onClick={() => setMobileMenuOpen(false)}
              >
                {tNav('students')}
              </NavLink>
              <NavLink
                href={withLocalePrefix(locale, '/pricing')}
                isActive={pathWithoutLocale === '/pricing'}
                mobile
                onClick={() => setMobileMenuOpen(false)}
              >
                {tNav('pricing')}
              </NavLink>
              <NavLink
                href={withLocalePrefix(locale, '/schools/pricing')}
                isActive={pathWithoutLocale === '/schools/pricing'}
                mobile
                onClick={() => setMobileMenuOpen(false)}
              >
                {tNav('schoolPricing')}
              </NavLink>
              <NavLink
                href={withLocalePrefix(locale, '/contact')}
                isActive={pathWithoutLocale === '/contact'}
                mobile
                onClick={() => setMobileMenuOpen(false)}
              >
                {tNav('contact')}
              </NavLink>
              <NavLink
                href={withLocalePrefix(locale, '/sign-in')}
                isActive={pathWithoutLocale === '/sign-in'}
                muted
                mobile
                onClick={() => setMobileMenuOpen(false)}
              >
                {tNav('login')}
              </NavLink>
              <div className="border-t border-slate-100 px-4 py-3 mt-2">
                <Button asChild className="w-full">
                  {pathWithoutLocale === '/schools' ? (
                    <Link href={SCHOOLS_DEMO_HREF} onClick={() => setMobileMenuOpen(false)}>
                      {tNav('bookDemo')}
                    </Link>
                  ) : (
                    <Link href={STUDENT_TRIAL_HREF} onClick={() => setMobileMenuOpen(false)}>
                      {tNav('startTrial')}
                    </Link>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <>
              <Link
                href={withLocalePrefix(locale, '/dashboard')}
                className="block px-4 py-3 font-medium text-gray-700 hover:bg-slate-50 hover:text-[#429ead]"
                onClick={() => setMobileMenuOpen(false)}
              >
                {tNav('dashboard')}
              </Link>
              <button
                type="button"
                className="block w-full px-4 py-3 text-left font-medium text-gray-700 hover:bg-slate-50 hover:text-[#429ead]"
                onClick={async () => {
                  await signOut();
                  mutate('/api/user');
                  setMobileMenuOpen(false);
                  router.push(withLocalePrefix(locale, '/academy'));
                }}
              >
                {tNav('logout')}
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
}
