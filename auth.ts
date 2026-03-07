import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { EmailNotVerifiedError } from '@/lib/auth/errors';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { comparePasswords } from '@/lib/auth/session';
import { authConfig } from './auth.config';

const isDev = process.env.NODE_ENV !== 'production';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || typeof credentials.email !== 'string') return null;
        if (!credentials?.password || typeof credentials.password !== 'string') return null;

        const email = credentials.email.trim();
        const password = credentials.password;

        const [user] = await db
          .select()
          .from(users)
          .where(
            and(
              sql`lower(${users.email}) = lower(${email})`,
              isNull(users.deletedAt)
            )
          )
          .limit(1);

        if (!user) {
          if (isDev) {
            const dbHost = process.env.POSTGRES_URL
              ? new URL(process.env.POSTGRES_URL.replace('postgresql://', 'https://')).hostname
              : 'unknown';
            console.log('[auth] User not found for email:', email, '| DB:', dbHost);
          }
          return null;
        }

        const valid = await comparePasswords(password, user.passwordHash);
        if (isDev) {
          const dbHost = process.env.POSTGRES_URL
            ? new URL(process.env.POSTGRES_URL.replace('postgresql://', 'https://')).hostname
            : 'unknown';
          console.log(
            '[auth] User found:',
            user.email,
            '| verified:',
            !!user.emailVerified,
            '| password match:',
            valid,
            '| DB:',
            dbHost
          );
        }

        if (!valid) return null;

        if (!user.emailVerified) {
          throw new EmailNotVerifiedError();
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          platformRole: user.platformRole,
          emailVerified: user.emailVerified,
        };
      },
    }),
  ],
});
