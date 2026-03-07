import { requirePlatformRole } from '@/lib/auth/user';
import { isImpersonating, CONNOR_ADMIN_EMAIL } from '@/lib/auth/impersonate';
import { getPrimaryClassForStudent } from '@/lib/db/queries/education';
import { getUnseenMessageNotificationCount } from '@/lib/db/queries/notifications';
import { DashboardSidebar } from './dashboard/dashboard-sidebar';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function safeGetPrimaryClassForStudent(userId: number): Promise<string | null> {
  try {
    const row = await getPrimaryClassForStudent(userId);
    return row?.id ?? null;
  } catch (err) {
    console.error('[WithSidebarLayout] getPrimaryClassForStudent failed:', err);
    return null;
  }
}

async function safeGetUnseenMessageNotificationCount(userId: number): Promise<number> {
  try {
    return await getUnseenMessageNotificationCount(userId);
  } catch (err) {
    console.error('[WithSidebarLayout] getUnseenMessageNotificationCount failed:', err);
    return 0;
  }
}

export default async function WithSidebarLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const user = await requirePlatformRole();
  const [studentPrimaryClassId, unreadMessageCount, impersonating] = await Promise.all([
    user.platformRole === 'student' ? safeGetPrimaryClassForStudent(user.id) : null,
    safeGetUnseenMessageNotificationCount(user.id),
    isImpersonating(),
  ]);
  const isConnorAsAdmin =
    !impersonating &&
    user.email?.trim().toLowerCase() === CONNOR_ADMIN_EMAIL &&
    user.platformRole === 'admin';
  return (
    <DashboardSidebar
      platformRole={user.platformRole}
      isImpersonating={impersonating}
      isConnorAsAdmin={isConnorAsAdmin}
      studentPrimaryClassId={studentPrimaryClassId}
      unreadMessageCount={unreadMessageCount}
      userName={user.name}
      userEmail={user.email}
      userAvatarUrl={user.avatarUrl ?? undefined}
    >
      {children}
    </DashboardSidebar>
  );
}
