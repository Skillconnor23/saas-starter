/**
 * Edge-safe Auth.js config. No database, drizzle, postgres, resend, or Node-only imports.
 * Used by middleware. Full config with Credentials provider lives in auth.ts.
 */
import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';

declare module 'next-auth' {
  interface User {
    id: number;
    email: string;
    name?: string | null;
    platformRole?: string | null;
    emailVerified?: Date | null;
  }

  interface Session {
    user: {
      id: number;
      email: string;
      name?: string | null;
      platformRole?: 'student' | 'admin' | 'teacher' | 'school_admin' | null;
      emailVerified?: Date | null;
    };
  }
}

export const authConfig = {
  pages: {
    signIn: '/sign-in',
    error: '/sign-in',
  },
  session: {
    strategy: 'jwt' as const,
    maxAge: 24 * 60 * 60, // 1 day
  },
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  providers: [], // Credentials provider added in auth.ts (Node-only)
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.platformRole = user.platformRole;
        token.emailVerified = user.emailVerified;
      }
      return token;
    },
    session({ session, token }) {
      if (session?.user) {
        (session.user as { id: number }).id = token.id as number;
        session.user.email = token.email as string;
        session.user.name = token.name as string | null;
        (session.user as { platformRole?: string | null }).platformRole =
          token.platformRole as string | null;
        (session.user as { emailVerified?: Date | null }).emailVerified =
          token.emailVerified as Date | null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

/** Edge-safe auth middleware. Use this in middleware.ts only. */
export const { auth: authMiddleware } = NextAuth(authConfig);
