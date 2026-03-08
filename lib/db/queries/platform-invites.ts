import { desc, eq, or, and } from 'drizzle-orm';
import { db } from '../drizzle';
import { platformInvites, schools, users, eduClasses } from '../schema';
export type PlatformInviteWithDetails = {
  id: string;
  email: string;
  platformRole: string;
  schoolId: string | null;
  schoolName: string | null;
  classId: string | null;
  className: string | null;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
  invitedByUserId: number;
  invitedByName: string | null;
  /** pending | accepted | expired */
  status: 'pending' | 'accepted' | 'expired';
};

function toStatus(row: { usedAt: Date | null; expiresAt: Date }): 'pending' | 'accepted' | 'expired' {
  const now = new Date();
  if (row.usedAt) return 'accepted';
  if (row.expiresAt < now) return 'expired';
  return 'pending';
}

/** List platform invites for admin. Filter by schoolId for school_admin. */
export async function listPlatformInvites(schoolIdFilter?: string | null): Promise<PlatformInviteWithDetails[]> {
  const baseQuery = db
    .select({
      id: platformInvites.id,
      email: platformInvites.email,
      platformRole: platformInvites.platformRole,
      schoolId: platformInvites.schoolId,
      classId: platformInvites.classId,
      expiresAt: platformInvites.expiresAt,
      usedAt: platformInvites.usedAt,
      createdAt: platformInvites.createdAt,
      invitedByUserId: platformInvites.invitedByUserId,
      schoolName: schools.name,
      className: eduClasses.name,
      invitedByName: users.name,
    })
    .from(platformInvites)
    .leftJoin(schools, eq(platformInvites.schoolId, schools.id))
    .leftJoin(eduClasses, eq(platformInvites.classId, eduClasses.id))
    .leftJoin(users, eq(platformInvites.invitedByUserId, users.id));

  const rows = schoolIdFilter
    ? await baseQuery
        .where(
          or(
            eq(platformInvites.schoolId, schoolIdFilter),
            and(eq(platformInvites.platformRole, 'student'), eq(eduClasses.schoolId, schoolIdFilter))
          )
        )
        .orderBy(desc(platformInvites.createdAt))
    : await baseQuery.orderBy(desc(platformInvites.createdAt));

  return (rows ?? []).map((row) => ({
    id: row.id,
    email: row.email,
    platformRole: row.platformRole,
    schoolId: row.schoolId,
    schoolName: row.schoolName ?? null,
    classId: row.classId ?? null,
    className: row.className ?? null,
    expiresAt: row.expiresAt,
    usedAt: row.usedAt,
    createdAt: row.createdAt,
    invitedByUserId: row.invitedByUserId,
    invitedByName: row.invitedByName ?? null,
    status: toStatus({ usedAt: row.usedAt, expiresAt: row.expiresAt }),
  }));
}

/** Revoke a platform invite by setting expiresAt to now. */
export async function revokePlatformInvite(id: string): Promise<boolean> {
  const [updated] = await db
    .update(platformInvites)
    .set({ expiresAt: new Date() })
    .where(eq(platformInvites.id, id))
    .returning({ id: platformInvites.id });
  return !!updated;
}
