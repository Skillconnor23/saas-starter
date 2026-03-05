'use client';

import { useActionState, useState } from 'react';
import { useLocale } from 'next-intl';
import {
  createOrGetClassInviteFormAction,
  regenerateClassInviteFormAction,
} from '@/lib/actions/class-invite';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';

type InviteLinkCardProps = {
  classId: string;
  initialToken: string | null;
};

export function InviteLinkCard({ classId, initialToken }: InviteLinkCardProps) {
  const t = useTranslations('classInvite');
  const locale = useLocale();
  const [createState, createAction, isCreatePending] = useActionState(
    createOrGetClassInviteFormAction,
    { token: null as string | null, error: null as string | null }
  );
  const token = createState?.token ?? initialToken;
  const [copied, setCopied] = useState(false);

  const [regenState, regenAction, isRegenPending] = useActionState(
    regenerateClassInviteFormAction,
    { error: null as string | null }
  );

  if (!token) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('inviteLink')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createAction}>
            <input type="hidden" name="classId" value={classId} />
            <Button type="submit" disabled={isCreatePending}>
              {isCreatePending ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {t('generateLink')}
            </Button>
          </form>
          {createState?.error && (
            <p className="mt-2 text-sm text-red-500">{createState.error}</p>
          )}
        </CardContent>
      </Card>
    );
  }

  const displayUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/${locale}/join/${token}`
      : `/${locale}/join/${token}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(displayUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{t('inviteLink')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={displayUrl}
            className="flex-1 rounded bg-muted px-3 py-2 text-sm font-mono"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            title={t('copyLink')}
          >
            {copied ? t('copied') : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <form action={regenAction}>
          <input type="hidden" name="classId" value={classId} />
          <Button type="submit" variant="outline" size="sm" disabled={isRegenPending}>
            <RefreshCw
              className={`mr-1 h-4 w-4 ${isRegenPending ? 'animate-spin' : ''}`}
            />
            {t('regenerateLink')}
          </Button>
        </form>
        {(regenState as { error?: string })?.error && (
          <p className="text-sm text-red-500">{(regenState as { error?: string }).error}</p>
        )}
      </CardContent>
    </Card>
  );
}
