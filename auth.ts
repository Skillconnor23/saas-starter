import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { EmailNotVerifiedError } from '@/lib/auth/errors';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { comparePasswords } from '@/lib/auth/session';
import { authConfig } from './auth.config';

const isDev = process.env.NODE_ENV !== 'production';
const authDebug = process.env.AUTH_DEBUG === 'true' || isDev;

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

        const email = credentials.email.trim().toLowerCase();
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

        const dbHost = process.env.POSTGRES_URL
          ? new URL(process.env.POSTGRES_URL.replace('postgresql://', 'https://')).hostname
          : 'unknown';

        if (!user) {
          if (authDebug) {
            console.log('[auth] User not found | normalized_email:', email, '| DB:', dbHost, '| rejection: user_not_found');
          }
          return null;
        }

        const hasPasswordHash = !!user.passwordHash && typeof user.passwordHash === 'string' && user.passwordHash.length > 0;
        const hashPrefix = hasPasswordHash ? user.passwordHash.slice(0, 7) : 'N/A';
        if (!hasPasswordHash) {
          if (authDebug) {
            console.log('[auth] User found but password_hash missing/empty | user_id:', user.id, '| email:', user.email, '| DB:', dbHost, '| rejection: no_password_hash');
          }
          return null;
        }

        const valid = await comparePasswords(password, user.passwordHash);
        const emailVerifiedRaw = user.emailVerified;
        const emailVerifiedTruthy = !!emailVerifiedRaw;

        if (authDebug) {
          const rejection =
            !valid
              ? 'password_mismatch'
              : !emailVerifiedTruthy
                ? 'email_not_verified'
                : 'none';
          console.log(
            '[auth] Sign-in attempt | normalized_email:',
            email,
            '| user_id:',
            user.id,
            '| user.email(DB):',
            user.email,
            '| password_hash_exists:',
            hasPasswordHash,
            '| password_hash_prefix:',
            hashPrefix,
            '| password_compare:',
            valid,
            '| email_verified(column):',
            emailVerifiedRaw ?? 'null',
            '| rejection:',
            rejection,
            '| DB:',
            dbHost
          );
        }

        if (!valid) return null;

        if (!emailVerifiedTruthy) {
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
