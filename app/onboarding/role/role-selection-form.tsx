'use client';

import { useActionState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

type ActionState = { error?: string };

type RoleSelectionFormProps = {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
};

/**
 * Self-service onboarding: student only. Elevated roles are invitation-only.
 * Form submits to server which ignores any client role input.
 */
export function RoleSelectionForm({ action }: RoleSelectionFormProps) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    action,
    {}
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Continue as Student</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          <p className="text-sm text-muted-foreground">
            You&apos;re signing up as a Student. Teachers and admins join by invitation only.
          </p>

          {state?.error && (
            <p className="text-sm text-red-500">{state.error}</p>
          )}

          <Button
            type="submit"
            className="w-full bg-orange-600 hover:bg-orange-700 text-white"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Continue to Dashboard'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
