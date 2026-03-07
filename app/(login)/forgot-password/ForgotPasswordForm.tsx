'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { submitForgotPassword } from './actions';

type ForgotPasswordFormProps = {
  t: {
    title: string;
    subtitle: string;
    emailLabel: string;
    emailPlaceholder: string;
    submit: string;
    sending: string;
    successMessage: string;
    backToSignIn: string;
  };
  tNav: { brand: string };
};

export function ForgotPasswordForm({ t, tNav }: ForgotPasswordFormProps) {
  const [state, formAction, pending] = useActionState(
    submitForgotPassword,
    null as { submitted?: boolean } | null
  );

  const submitted = state?.submitted === true;

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-[#fafbfc] px-4 py-10 sm:px-6 lg:px-8">
      <div className="w-full max-w-md rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-[0_4px_24px_rgba(15,23,42,0.06)] sm:p-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#e5e7eb] bg-white">
              <Image
                src="/gecko-logo.svg"
                alt={tNav.brand}
                width={120}
                height={120}
                sizes="40px"
                className="h-10 w-10 object-contain"
                unoptimized
              />
            </div>
            <span className="text-base font-semibold text-[#1f2937]">
              {tNav.brand}
            </span>
          </div>
          <h1 className="mt-6 text-xl sm:text-2xl font-semibold tracking-tight text-[#111827]">
            {t.title}
          </h1>
          <p className="mt-2 text-sm text-[#6b7280]">
            {t.subtitle}
          </p>
        </div>

        {submitted ? (
          <div className="mt-6 rounded-xl border border-[#7daf41]/30 bg-[#f0f9eb] px-4 py-4">
            <p className="text-sm font-medium text-[#2d5a27]">
              {t.successMessage}
            </p>
            <Link
              href="/sign-in"
              className="mt-4 inline-block text-sm font-medium text-[#429ead] hover:underline"
            >
              {t.backToSignIn}
            </Link>
          </div>
        ) : (
          <form className="mt-8 space-y-5" action={formAction}>
            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="block text-sm font-medium text-[#374151]"
              >
                {t.emailLabel}
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={255}
                className="w-full rounded-full border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#111827] placeholder:text-gray-400 shadow-[0_1px_2px_rgba(15,23,42,0.04)] focus-visible:border-[#7daf41] focus-visible:ring-2 focus-visible:ring-[#7daf41] focus-visible:ring-offset-0"
                placeholder={t.emailPlaceholder}
              />
            </div>
            <div className="space-y-3">
              <Button
                type="submit"
                disabled={pending}
                className="inline-flex w-full items-center justify-center rounded-full border-2 border-transparent bg-[#7daf41] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:border-[#7daf41] hover:bg-[#6b9a39] hover:shadow-md disabled:opacity-60 disabled:shadow-none"
              >
                {pending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t.sending}
                  </>
                ) : (
                  t.submit
                )}
              </Button>
              <p className="text-center text-sm text-[#6b7280]">
                <Link href="/sign-in" className="font-medium text-[#429ead] hover:underline">
                  {t.backToSignIn}
                </Link>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
