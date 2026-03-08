'use client';

import { useActionState, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { createPlatformInviteAction } from './actions';

type School = { id: string; name: string };
type ClassItem = { id: string; name: string };

export function InviteForm({
  schools,
  classes,
  canInviteSchoolAdmin,
  inviterUserId,
  defaultLocale = 'en',
}: {
  schools: School[];
  classes: ClassItem[];
  canInviteSchoolAdmin: boolean;
  inviterUserId: number;
  defaultLocale?: 'en' | 'mn';
}) {
  const [state, formAction, pending] = useActionState(createPlatformInviteAction, {
    success: null as string | null,
    error: null as string | null,
  });
  const [selectedRole, setSelectedRole] = useState<string>('teacher');
  const [emailLocale, setEmailLocale] = useState<'en' | 'mn'>(defaultLocale);

  return (
    <form
      action={formAction}
      className="max-w-md space-y-4 rounded-lg border border-[#e5e7eb] bg-white p-6"
    >
      <input type="hidden" name="inviterUserId" value={inviterUserId} />
      <div className="space-y-2">
        <Label htmlFor="emailLocale">Email language</Label>
        <select
          id="emailLocale"
          name="locale"
          value={emailLocale}
          onChange={(e) => setEmailLocale(e.target.value as 'en' | 'mn')}
          className="w-full rounded-md border border-[#e5e7eb] px-3 py-2 text-sm"
        >
          <option value="en">English</option>
          <option value="mn">Монгол</option>
        </select>
      </div>
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
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="w-full rounded-md border border-[#e5e7eb] px-3 py-2 text-sm"
        >
          <option value="teacher">Teacher</option>
          {canInviteSchoolAdmin && <option value="school_admin">School Admin</option>}
          <option value="student">Student</option>
        </select>
      </div>
      {selectedRole === 'student' && (
        <div className="space-y-2">
          <Label htmlFor="classId">Class (required for Student)</Label>
          <select
            id="classId"
            name="classId"
            required
            className="w-full rounded-md border border-[#e5e7eb] px-3 py-2 text-sm"
          >
          <option value="">— Select a class —</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
          </select>
        </div>
      )}
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
        <div className="flex flex-col gap-2 rounded-lg border border-[#7daf41]/30 bg-[#7daf41]/5 p-4">
          <p className="text-sm font-medium text-[#7daf41]">Invite sent</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded bg-white px-2 py-1 text-xs text-[#374151]">
              {state.success}
            </code>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(state.success ?? '');
                } catch {
                  // ignore
                }
              }}
              className="shrink-0"
            >
              Copy link
            </Button>
          </div>
        </div>
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
