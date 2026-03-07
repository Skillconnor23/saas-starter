import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { locales, defaultLocale, localeCookieName } from './lib/i18n/config';
import { authMiddleware } from '@/auth.config';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
  localeCookie: { name: localeCookieName, sameSite: 'lax' as const },
});

const protectedRoutePrefixes = ['/dashboard', '/onboarding', '/classroom'];
const legacyMarketingPaths = ['/home', '/landing', '/marketing', '/site'];

export default authMiddleware((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const pathWithoutLocale = pathname.replace(/^\/(en|mn)/, '') || '/';

  const isProtectedRoute = protectedRoutePrefixes.some((p) =>
    pathWithoutLocale.startsWith(p)
  );

  if (
    legacyMarketingPaths.includes(pathWithoutLocale) ||
    legacyMarketingPaths.includes(pathname)
  ) {
    return NextResponse.redirect(new URL('/academy', req.url));
  }

  if (isProtectedRoute && !session) {
    const localeSegment = pathname.startsWith('/en')
      ? '/en'
      : pathname.startsWith('/mn')
        ? '/mn'
        : '';
    const signInPath = localeSegment
      ? `${localeSegment}/sign-in`
      : '/sign-in';
    return NextResponse.redirect(new URL(signInPath, req.url));
  }

  return intlMiddleware(req);
});

export const config = {
  matcher: [
    // Apply middleware to everything except API routes, Next internals, and static files.
    '/((?!api|_next|.*\\..*).*)'
  ]
};
