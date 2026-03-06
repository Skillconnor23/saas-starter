'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { createPlatformInviteAction } from './actions';

type School = { id: string; name: string };

export function InviteForm({
  schools,
  canInviteSchoolAdmin,
  inviterUserId,
}: {
  schools: School[];
  canInviteSchoolAdmin: boolean;
  inviterUserId: number;
}) {
  const [state, formAction, pending] = useActionState(createPlatformInviteAction, {
    success: null as string | null,
    error: null as string | null,
  });

  return (
    <form
      action={formAction}
      className="max-w-md space-y-4 rounded-lg border border-[#e5e7eb] bg-white p-6"
    >
      <input type="hidden" name="inviterUserId" value={inviterUserId} />
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          placeholder="teacher@school.com"
          className="w-full"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <select
          id="role"
          name="role"
          required
          className="w-full rounded-md border border-[#e5e7eb] px-3 py-2 text-sm"
        >
          <option value="teacher">Teacher</option>
          {canInviteSchoolAdmin && <option value="school_admin">School Admin</option>}
        </select>
      </div>
      {canInviteSchoolAdmin && (
        <div className="space-y-2">
          <Label htmlFor="schoolId">School (required for School Admin)</Label>
          <select
            id="schoolId"
            name="schoolId"
            className="w-full rounded-md border border-[#e5e7eb] px-3 py-2 text-sm"
          >
            <option value="">—</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}
      {schools.length === 1 && canInviteSchoolAdmin && (
        <input type="hidden" name="schoolId" value={schools[0]!.id} />
      )}
      {state?.error && (
        <p className="text-sm text-[#b64b29]">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-sm text-[#7daf41]">
          Invite sent. Link (if needed): {state.success}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending…
          </>
        ) : (
          'Send invite'
        )}
      </Button>
    </form>
  );
}
