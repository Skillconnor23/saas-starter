import { eq, and, sql, or, ilike, inArray, isNull } from 'drizzle-orm';
import { db } from '../drizzle';
import {
  schools,
  schoolMemberships,
  users,
  eduClasses,
  eduEnrollments,
} from '../schema';
import type { NewSchool } from '../schema';

export type CreateSchoolData = {
  name: string;
  slug: string;
};

export type UpdateSchoolData = {
  name?: string;
  slug?: string;
  isArchived?: boolean;
  archivedAt?: Date | null;
};

export type ListSchoolsFilters = {
  includeArchived?: boolean;
};

export async function listSchools(filters?: ListSchoolsFilters) {
  const includeArchived = filters?.includeArchived === true;
  if (includeArchived) {
    return db.select().from(schools).orderBy(schools.name);
  }
  return db
    .select()
    .from(schools)
    .where(eq(schools.isArchived, false))
    .orderBy(schools.name);
}

/** Schools for invite dropdown. Pass schoolId to limit to one school (school_admin). */
export async function getSchoolsForInviteSelector(schoolId?: string) {
  const base = db
    .select({ id: schools.id, name: schools.name })
    .from(schools)
    .where(eq(schools.isArchived, false))
    .orderBy(schools.name);
  if (schoolId) {
    return db
      .select({ id: schools.id, name: schools.name })
      .from(schools)
      .where(and(eq(schools.id, schoolId), eq(schools.isArchived, false)))
      .orderBy(schools.name);
  }
  return base;
}

export async function getSchoolById(id: string) {
  const [row] = await db
    .select()
    .from(schools)
    .where(eq(schools.id, id))
    .limit(1);
  return row ?? null;
}

export async function getSchoolBySlug(slug: string) {
  const [row] = await db
    .select()
    .from(schools)
    .where(eq(schools.slug, slug))
    .limit(1);
  return row ?? null;
}

export async function createSchool(data: CreateSchoolData): Promise<NonNullable<Awaited<ReturnType<typeof getSchoolById>>>> {
  const [created] = await db
    .insert(schools)
    .values({
      name: data.name,
      slug: data.slug.trim().toLowerCase().replace(/\s+/g, '-'),
      updatedAt: new Date(),
    } as NewSchool)
    .returning();
  if (!created) throw new Error('Failed to create school');
  return created;
}

export async function updateSchool(
  id: string,
  data: UpdateSchoolData
) {
  const payload: Partial<{ name: string; slug: string; isArchived: boolean; archivedAt: Date | null; updatedAt: Date }> = {
    updatedAt: new Date(),
  };
  if (data.name != null) payload.name = data.name;
  if (data.slug != null) payload.slug = data.slug.trim().toLowerCase().replace(/\s+/g, '-');
  if (data.isArchived != null) payload.isArchived = data.isArchived;
  if (data.archivedAt !== undefined) payload.archivedAt = data.archivedAt;
  const [updated] = await db
    .update(schools)
    .set(payload)
    .where(eq(schools.id, id))
    .returning();
  return updated ?? null;
}

/** Eligible school admins: users with platformRole = school_admin. Optional search; returns id, name, email, currentSchoolName. */
export async function getSchoolAdminCandidates(options?: {
  search?: string;
  limit?: number;
}) {
  const limit = Math.min(options?.limit ?? 50, 100);
  const conditions = [
    eq(users.platformRole, 'school_admin'),
    isNull(users.deletedAt),
  ];
  if (options?.search?.trim()) {
    const pattern = `%${options.search.trim()}%`;
    conditions.push(or(ilike(users.name, pattern), ilike(users.email, pattern))!);
  }
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
    })
    .from(users)
    .where(and(...conditions))
    .orderBy(users.name)
    .limit(limit);

  const userIds = rows.map((r) => r.id);
  if (userIds.length === 0) return rows.map((r) => ({ ...r, currentSchoolName: null as string | null }));

  const memberships = await db
    .select({
      userId: schoolMemberships.userId,
      schoolName: schools.name,
    })
    .from(schoolMemberships)
    .innerJoin(schools, eq(schoolMemberships.schoolId, schools.id))
    .where(inArray(schoolMemberships.userId, userIds));

  const schoolByUser = new Map(memberships.map((m) => [m.userId, m.schoolName]));
  return rows.map((r) => ({
    ...r,
    currentSchoolName: schoolByUser.get(r.id) ?? null,
  }));
}

/** School IDs the user is a member of (e.g. as school_admin). */
export async function getSchoolIdsForUser(userId: number): Promise<string[]> {
  const rows = await db
    .select({ schoolId: schoolMemberships.schoolId })
    .from(schoolMemberships)
    .where(eq(schoolMemberships.userId, userId));
  return rows.map((r) => r.schoolId);
}

export async function listSchoolMemberships(schoolId: string) {
  return db
    .select({
      membership: schoolMemberships,
      userName: users.name,
      userEmail: users.email,
      userId: users.id,
    })
    .from(schoolMemberships)
    .innerJoin(users, eq(schoolMemberships.userId, users.id))
    .where(eq(schoolMemberships.schoolId, schoolId));
}

export async function addSchoolMember(
  schoolId: string,
  userId: number,
  role: string = 'school_admin'
) {
  const [inserted] = await db
    .insert(schoolMemberships)
    .values({
      schoolId,
      userId,
      role,
    })
    .returning();
  return inserted ?? null;
}

export async function removeSchoolMember(schoolId: string, userId: number) {
  await db
    .delete(schoolMemberships)
    .where(
      and(
        eq(schoolMemberships.schoolId, schoolId),
        eq(schoolMemberships.userId, userId)
      )
    );
}

export async function isUserSchoolAdmin(userId: number, schoolId: string): Promise<boolean> {
  const [row] = await db
    .select({ schoolId: schoolMemberships.schoolId })
    .from(schoolMemberships)
    .where(
      and(
        eq(schoolMemberships.userId, userId),
        eq(schoolMemberships.schoolId, schoolId)
      )
    )
    .limit(1);
  return !!row;
}

/** Classes for a school (for admin/school-admin views). Excludes archived by default. */
export async function listClassesForSchool(schoolId: string, options?: { includeArchived?: boolean }) {
  const conditions = [eq(eduClasses.schoolId, schoolId)];
  if (options?.includeArchived !== true) {
    conditions.push(eq(eduClasses.isArchived, false));
  }
  return db
    .select()
    .from(eduClasses)
    .where(and(...conditions))
    .orderBy(eduClasses.name);
}

/** Count active (non-archived) classes per school (for admin list). */
export async function getClassCountBySchoolId(schoolId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(eduClasses)
    .where(and(eq(eduClasses.schoolId, schoolId), eq(eduClasses.isArchived, false)));
  return row?.count ?? 0;
}

/** Count distinct students in active (non-archived) classes belonging to this school. */
export async function getStudentCountBySchoolId(schoolId: string): Promise<number> {
  const [row] = await db
    .select({
      count: sql<number>`count(distinct ${eduEnrollments.studentUserId})::int`,
    })
    .from(eduEnrollments)
    .innerJoin(eduClasses, eq(eduEnrollments.classId, eduClasses.id))
    .where(
      and(
        eq(eduClasses.schoolId, schoolId),
        eq(eduClasses.isArchived, false),
        eq(eduEnrollments.status, 'active')
      )
    );
  return row?.count ?? 0;
}

/** Count school admins (members) for a school. */
export async function getSchoolAdminCountBySchoolId(schoolId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schoolMemberships)
    .where(eq(schoolMemberships.schoolId, schoolId));
  return row?.count ?? 0;
}
