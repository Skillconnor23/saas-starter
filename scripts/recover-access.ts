/**
 * DEV-ONLY: Recover access for a user by marking them verified and optionally setting a password.
 * Usage: pnpm recover <email> [newPassword]
 *
 * Uses dotenv (same as seed-demo) so script and app use the same .env and POSTGRES_URL.
 */
import 'dotenv/config';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { db } from '../lib/db/drizzle';
import { users } from '../lib/db/schema';
import { hashPassword } from '../lib/auth/session';

const ENABLED =
  process.env.ENABLE_DEV_RECOVERY === 'true' ||
  process.env.NODE_ENV !== 'production';

async function main() {
  const email = process.argv[2]?.trim();
  const newPassword = process.argv[3];

  if (!ENABLED) {
    console.error('Recovery is disabled. Set ENABLE_DEV_RECOVERY=true or NODE_ENV=development');
    process.exit(1);
  }

  if (!email || !email.includes('@')) {
    console.error('Usage: pnpm recover <email> [newPassword]');
    console.error('  email       - User email (required)');
    console.error('  newPassword - Optional: set this as the new password (min 8 chars)');
    process.exit(1);
  }

  const [user] = await db
    .select({ id: users.id, email: users.email, emailVerified: users.emailVerified })
    .from(users)
    .where(
      and(
        sql`lower(${users.email}) = lower(${email})`,
        isNull(users.deletedAt)
      )
    )
    .limit(1);

  if (!user) {
    console.error('User not found:', email);
    process.exit(1);
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (!user.emailVerified) {
    updates.emailVerified = new Date();
    console.log('Marking user as verified...');
  }

  if (newPassword && newPassword.length >= 8) {
    updates.passwordHash = await hashPassword(newPassword);
    console.log('Setting new password...');
  } else if (newPassword) {
    console.error('Password must be at least 8 characters');
    process.exit(1);
  }

  if (Object.keys(updates).length <= 1) {
    console.log('User already verified. Pass a new password to reset: pnpm recover', email, '<newPassword>');
    process.exit(0);
  }

  await db.update(users).set(updates as Record<string, never>).where(eq(users.id, user.id));

  const dbUrl = process.env.POSTGRES_URL;
  const dbHost = dbUrl ? new URL(dbUrl.replace('postgresql://', 'https://')).hostname : 'unknown';
  console.log('Done. User', email, 'can now sign in.');
  console.log('DB host:', dbHost, '(script and app must use same POSTGRES_URL)');
  if (newPassword) {
    console.log('Use the password you provided to sign in.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
