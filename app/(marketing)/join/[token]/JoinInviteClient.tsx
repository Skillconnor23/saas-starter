'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import {
  joinClassWithInviteFormAction,
  setClassInviteCookieAndRedirectToSignUp,
  setClassInviteCookieAndRedirectToSignIn,
} from '@/lib/actions/class-invite';

type Labels = {
  joinThisClass: string;
  createStudentAccount: string;
  logIn: string;
};

export function JoinInviteClient({
  token,
  isLoggedInAsStudent,
  labels,
}: {
  token: string;
  isLoggedInAsStudent: boolean;
  labels: Labels;
}) {
  const [state, formAction, isPending] = useActionState(
    joinClassWithInviteFormAction,
    { error: null as string | null }
  );

  if (isLoggedInAsStudent) {
    return (
      <div className="space-y-4">
        <form action={formAction}>
          <input type="hidden" name="token" value={token} />
          <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {labels.joinThisClass}
              </>
            ) : (
              labels.joinThisClass
            )}
          </Button>
        </form>
        {state?.error && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {labels.createStudentAccount} or {labels.logIn} to join.
      </p>
      <div className="flex flex-wrap gap-3">
        <form action={setClassInviteCookieAndRedirectToSignUp}>
          <input type="hidden" name="token" value={token} />
          <Button type="submit" variant="default">
            {labels.createStudentAccount}
          </Button>
        </form>
        <form action={setClassInviteCookieAndRedirectToSignIn}>
          <input type="hidden" name="token" value={token} />
          <Button type="submit" variant="outline">
            {labels.logIn}
          </Button>
        </form>
      </div>
    </div>
  );
}
