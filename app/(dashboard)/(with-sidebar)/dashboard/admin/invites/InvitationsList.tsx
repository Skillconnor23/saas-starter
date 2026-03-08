'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  resendPlatformInviteAction,
  revokePlatformInviteAction,
} from './actions';
import type { PlatformInviteWithDetails } from '@/lib/db/queries/platform-invites';
import { Mail, RefreshCw, XCircle, Loader2 } from 'lucide-react';

type Invitation = PlatformInviteWithDetails;

function formatDate(d: Date) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(d));
}

function statusBadge(status: Invitation['status']) {
  const styles: Record<Invitation['status'], string> = {
    pending: 'bg-amber-100 text-amber-800',
    accepted: 'bg-green-100 text-green-800',
    expired: 'bg-slate-100 text-slate-600',
  };
  const labels: Record<Invitation['status'], string> = {
    pending: 'Pending',
    accepted: 'Accepted',
    expired: 'Expired',
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function roleLabel(role: string) {
  if (role === 'school_admin') return 'School Admin';
  if (role === 'student') return 'Student';
  return 'Teacher';
}

export function InvitationsList({
  invitations,
  locale = 'en',
}: {
  invitations: Invitation[];
  locale?: 'en' | 'mn';
}) {
  const [resending, setResending] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  async function handleResend(inv: Invitation) {
    setResending(inv.id);
    try {
      const { link, error } = await resendPlatformInviteAction(inv.id, locale);
      if (error) {
        alert(error);
      } else if (link) {
        try {
          await navigator.clipboard.writeText(link);
        } catch {
          // ignore clipboard errors
        }
      }
    } finally {
      setResending(null);
    }
  }

  async function handleRevoke(inv: Invitation) {
    if (inv.status !== 'pending') return;
    setRevoking(inv.id);
    try {
      const { error } = await revokePlatformInviteAction(inv.id);
      if (error) alert(error);
    } finally {
      setRevoking(null);
    }
  }

  if (!invitations || invitations.length === 0) {
    return (
      <div className="rounded-xl border border-[#e5e7eb] bg-white p-12 text-center">
        <Mail className="mx-auto h-12 w-12 text-slate-300" />
        <p className="mt-4 text-sm font-medium text-[#374151]">No invitations yet</p>
        <p className="mt-1 text-sm text-[#6b7280]">
          Send a new invite above to invite a teacher, school admin, or student.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[#e5e7eb] bg-white">
      <table className="min-w-full divide-y divide-[#e5e7eb]">
        <thead>
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#6b7280]">
              Email
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#6b7280]">
              Role
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#6b7280]">
              School / Class
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#6b7280]">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#6b7280]">
              Created
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#6b7280]">
              Expires
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-[#6b7280]">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e5e7eb]">
          {invitations.map((inv) => (
            <tr key={inv.id} className="hover:bg-[#f9fafb]">
              <td className="px-4 py-3 text-sm text-[#111827]">{inv.email}</td>
              <td className="px-4 py-3 text-sm text-[#374151]">{roleLabel(inv.platformRole)}</td>
              <td className="px-4 py-3 text-sm text-[#6b7280]">
                {inv.platformRole === 'student' ? (inv.className ?? '—') : (inv.schoolName ?? '—')}
              </td>
              <td className="px-4 py-3">{statusBadge(inv.status)}</td>
              <td className="px-4 py-3 text-sm text-[#6b7280]">{formatDate(inv.createdAt)}</td>
              <td className="px-4 py-3 text-sm text-[#6b7280]">{formatDate(inv.expiresAt)}</td>
              <td className="px-4 py-3 text-right">
                {inv.status === 'pending' && (
                  <span className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!!resending}
                      onClick={() => handleResend(inv)}
                      className="text-[#429ead] hover:text-[#388694]"
                      title="Resend invite"
                    >
                      {resending === inv.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!!revoking}
                      onClick={() => handleRevoke(inv)}
                      className="text-[#b64b29] hover:text-[#9a3f23]"
                      title="Revoke invite"
                    >
                      {revoking === inv.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                    </Button>
                  </span>
                )}
                {inv.status !== 'pending' && <span className="text-xs text-[#9ca3af]">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
