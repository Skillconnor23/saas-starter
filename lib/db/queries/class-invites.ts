import { and, eq, sql } from 'drizzle-orm';
import { db } from '../drizzle';
import { classInvites, eduClasses } from '../schema';
import { generateInviteToken } from '@/lib/education/invite-token';

export type InviteWithClass = {
  id: string;
  classId: string;
  token: string;
  className: string | null;
  isActive: boolean;
  expiresAt: Date | null;
  maxUses: number | null;
  usesCount: number;
};

/** Get invite by token with class name. Returns null if not found or invalid. */
export async function getInviteByToken(token: string): Promise<InviteWithClass | null> {
  const [row] = await db
    .select({
      id: classInvites.id,
      classId: classInvites.classId,
      token: classInvites.token,
      className: eduClasses.name,
      isActive: classInvites.isActive,
      expiresAt: classInvites.expiresAt,
      maxUses: classInvites.maxUses,
      usesCount: classInvites.usesCount,
    })
    .from(classInvites)
    .innerJoin(eduClasses, eq(classInvites.classId, eduClasses.id))
    .where(eq(classInvites.token, token))
    .limit(1);
  return row ? { ...row, className: row.className } : null;
}

/** Validate invite: exists, active, not expired, not over max uses. */
export function isInviteValid(inv: InviteWithClass | null): inv is InviteWithClass {
  if (!inv) return false;
  if (!inv.isActive) return false;
  if (inv.expiresAt && inv.expiresAt < new Date()) return false;
  if (inv.maxUses != null && inv.usesCount >= inv.maxUses) return false;
  return true;
}

/** Get active invite for a class (for teacher UI - show current link). */
export async function getActiveInviteForClass(classId: string) {
  const [row] = await db
    .select()
    .from(classInvites)
    .where(
      and(
        eq(classInvites.classId, classId),
        eq(classInvites.isActive, true)
      )
    )
    .orderBy(sql`${classInvites.createdAt} desc`)
    .limit(1);
  return row ?? null;
}

/** Create a new invite for a class. Deactivates any existing active invite for that class. */
export async function createClassInvite(classId: string, createdByUserId: number) {
  await db
    .update(classInvites)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(classInvites.classId, classId));

  const MAX_RETRIES = 5;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const token = generateInviteToken();
    try {
      const [created] = await db
        .insert(classInvites)
        .values({
          classId,
          token,
          createdByUserId,
          isActive: true,
        })
        .returning();
      return created;
    } catch (err) {
      const isUniqueViolation =
        err instanceof Error && 'code' in err && (err as { code?: string }).code === '23505';
      if (!isUniqueViolation || attempt === MAX_RETRIES - 1) throw err;
    }
  }
  throw new Error('Could not generate unique invite token');
}

/** Regenerate: create new invite and deactivate old one. */
export async function regenerateClassInvite(classId: string, createdByUserId: number) {
  return createClassInvite(classId, createdByUserId);
}

/** Increment uses_count for invite by token. Returns classId. Use after enrolling the student. */
export async function incrementInviteUses(token: string): Promise<{ classId: string } | null> {
  const [updated] = await db
    .update(classInvites)
    .set({
      usesCount: sql`${classInvites.usesCount} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(classInvites.token, token))
    .returning({ classId: classInvites.classId });
  return updated ? { classId: updated.classId } : null;
}
