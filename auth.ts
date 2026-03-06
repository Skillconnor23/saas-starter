import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { EmailNotVerifiedError } from '@/lib/auth/errors';
import { eq, and, isNull } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { comparePasswords } from '@/lib/auth/session';
import { authConfig } from './auth.config';

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

        const [user] = await db
          .select()
          .from(users)
          .where(
            and(eq(users.email, credentials.email), isNull(users.deletedAt))
          )
          .limit(1);

        if (!user) return null;
        const valid = await comparePasswords(credentials.password, user.passwordHash);
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
