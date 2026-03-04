import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { locales, defaultLocale, localeCookieName } from './lib/i18n/config';
import { signToken, verifyToken } from '@/lib/auth/session';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
  // Use the same cookie name everywhere so manual setting in the language
  // switcher keeps redirects consistent.
  localeCookie: { name: localeCookieName, sameSite: 'lax' as const }
});

const protectedRoutePrefixes = ['/dashboard', '/onboarding', '/classroom'];
const legacyMarketingPaths = ['/home', '/landing', '/marketing', '/site'];

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session');
  // Strip locale prefix so /en/dashboard and /mn/dashboard both match
  const pathWithoutLocale = pathname.replace(/^\/(en|mn)/, '') || '/';
  const isProtectedRoute = protectedRoutePrefixes.some((p) => pathWithoutLocale.startsWith(p));

  // Redirect old starter landing routes to default marketing entry (locale-agnostic).
  if (legacyMarketingPaths.includes(pathWithoutLocale) || legacyMarketingPaths.includes(pathname)) {
    return NextResponse.redirect(new URL('/academy', request.url));
  }

  // If route is protected and no session, send to sign-in (preserve locale if present).
  if (isProtectedRoute && !sessionCookie) {
    const localeSegment = pathname.startsWith('/en') ? '/en' : pathname.startsWith('/mn') ? '/mn' : '';
    const signInPath = localeSegment ? `${localeSegment}/sign-in` : '/sign-in';
    return NextResponse.redirect(new URL(signInPath, request.url));
  }

  // First run next-intl middleware to handle locale detection & routing.
  let res = intlMiddleware(request);

  if (sessionCookie && request.method === 'GET') {
    try {
      const parsed = await verifyToken(sessionCookie.value);
      const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);

      res.cookies.set({
        name: 'session',
        value: await signToken({
          ...parsed,
          expires: expiresInOneDay.toISOString()
        }),
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        expires: expiresInOneDay
      });
    } catch (error) {
      console.error('Error updating session:', error);
      res.cookies.delete('session');
      if (isProtectedRoute) {
        return NextResponse.redirect(new URL('/sign-in', request.url));
      }
    }
  }

  return res;
}

export const config = {
  matcher: [
    // Apply middleware to everything except API routes, Next internals, and static files.
    '/((?!api|_next|.*\\..*).*)'
  ]
};
