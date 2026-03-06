import { requirePermission } from '@/lib/auth/permissions';
import { getSchoolsForInviteSelector } from '@/lib/db/queries/schools';
import { InviteForm } from './InviteForm';

export const dynamic = 'force-dynamic';

export default async function AdminInvitesPage() {
  const user = await requirePermission('invites:create');
  const isPlatformAdmin = user.platformRole === 'admin';
  const schools = isPlatformAdmin
    ? await getSchoolsForInviteSelector()
    : await getSchoolsForInviteSelector(user.schoolId ?? undefined);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Send Platform Invites</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Invite teachers or school admins via email. Invite links are single-use
          and expire in 7 days.
        </p>
      </div>
      <InviteForm
        schools={schools}
        canInviteSchoolAdmin={isPlatformAdmin || user.platformRole === 'school_admin'}
        inviterUserId={user.id}
      />
    </div>
  );
}
