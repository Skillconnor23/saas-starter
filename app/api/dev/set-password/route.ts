import { NextResponse } from 'next/server';
import { eq, and, isNull } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { hashPassword } from '@/lib/auth/session';

const DEV_RECOVERY_SECRET = process.env.DEV_RECOVERY_SECRET;
const ENABLED =
  process.env.ENABLE_DEV_RECOVERY === 'true' &&
  (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test');

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function POST(req: Request) {
  if (!ENABLED || !DEV_RECOVERY_SECRET) {
    return NextResponse.json(
      { error: 'Dev recovery is not enabled' },
      { status: 403 }
    );
  }

  const secret = req.headers.get('x-dev-recovery-secret');
  if (secret !== DEV_RECOVERY_SECRET) {
    return unauthorized();
  }

  const body = await req.json().catch(() => ({}));
  const userId = body.userId ? Number(body.userId) : null;
  const email = typeof body.email === 'string' ? body.email.trim() : null;
  const password = typeof body.password === 'string' ? body.password : null;

  if (!password || password.length < 8) {
    return NextResponse.json(
      { error: 'password (string, min 8 chars) is required' },
      { status: 400 }
    );
  }

  if (!userId && !email) {
    return NextResponse.json(
      { error: 'Provide userId (number) or email (string)' },
      { status: 400 }
    );
  }

  const where = userId
    ? eq(users.id, userId)
    : and(eq(users.email, email!), isNull(users.deletedAt))!;

  const passwordHash = await hashPassword(password);

  const updated = await db
    .update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(where)
    .returning({ id: users.id, email: users.email });

  if (updated.length === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    message: 'Password updated',
    user: { id: updated[0].id, email: updated[0].email },
  });
}
