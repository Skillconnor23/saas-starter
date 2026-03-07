'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useActionState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { resetPasswordAction } from './actions';

type ResetPasswordFormProps = {
  token: string;
  t: {
    title: string;
    subtitle: string;
    newPasswordLabel: string;
    confirmPasswordLabel: string;
    passwordPlaceholder: string;
    confirmPasswordPlaceholder: string;
    submit: string;
    resetting: string;
    successTitle: string;
    successDesc: string;
    signIn: string;
    invalidToken: string;
    invalidTokenTitle: string;
    missingToken: string;
    requestNewLink: string;
    passwordMismatch: string;
  };
  tNav: { brand: string };
};

export function ResetPasswordForm({ token, t, tNav }: ResetPasswordFormProps) {
  const [state, formAction, pending] = useActionState(
    resetPasswordAction,
    null as { success?: boolean; error?: string } | null
  );

  const success = state?.success === true;
  const errorKey = state?.error;

  const errorMessage = useMemo(() => {
    if (!errorKey) return null;
    if (errorKey === 'passwordMismatch') return t.passwordMismatch;
    return t.invalidToken;
  }, [errorKey, t]);

  if (!token) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#fafbfc] px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-[0_4px_24px_rgba(15,23,42,0.06)] sm:p-8 text-center">
          <h1 className="text-xl font-semibold text-[#111827]">{t.invalidTokenTitle}</h1>
          <p className="mt-3 text-sm text-[#6b7280]">{t.missingToken}</p>
          <Link
            href="/forgot-password"
            className="mt-6 inline-block text-sm font-medium text-[#429ead] hover:underline"
          >
            {t.requestNewLink}
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#fafbfc] px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-[0_4px_24px_rgba(15,23,42,0.06)] sm:p-8 text-center">
          <div className="flex flex-col items-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#7daf41]/30 bg-[#f0f9eb]">
              <span className="text-lg text-[#7daf41]" aria-hidden>✓</span>
            </div>
            <h1 className="mt-4 text-xl font-semibold text-[#111827]">{t.successTitle}</h1>
            <p className="mt-2 text-sm text-[#6b7280]">{t.successDesc}</p>
            <Link
              href="/sign-in"
              className="mt-6 inline-block rounded-full bg-[#7daf41] px-4 py-2 text-sm font-medium text-white hover:bg-[#6b9a39]"
            >
              {t.signIn}
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
            <span className="text-base font-semibold text-[#1f2937]">{tNav.brand}</span>
          </div>
          <h1 className="mt-6 text-xl sm:text-2xl font-semibold tracking-tight text-[#111827]">
            {t.title}
          </h1>
          <p className="mt-2 text-sm text-[#6b7280]">{t.subtitle}</p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3"
          >
            <p className="text-sm font-medium text-[#b64b29]">{errorMessage}</p>
          </div>
        )}

        <form className="mt-8 space-y-5" action={formAction}>
          <input type="hidden" name="token" value={token} />
          <div className="space-y-1.5">
            <Label htmlFor="password" className="block text-sm font-medium text-[#374151]">
              {t.newPasswordLabel}
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={100}
              className="w-full rounded-full border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#111827] placeholder:text-gray-400 focus-visible:border-[#7daf41] focus-visible:ring-2 focus-visible:ring-[#7daf41] focus-visible:ring-offset-0"
              placeholder={t.passwordPlaceholder}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="block text-sm font-medium text-[#374151]">
              {t.confirmPasswordLabel}
            </Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={100}
              className="w-full rounded-full border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#111827] placeholder:text-gray-400 focus-visible:border-[#7daf41] focus-visible:ring-2 focus-visible:ring-[#7daf41] focus-visible:ring-offset-0"
              placeholder={t.confirmPasswordPlaceholder}
            />
          </div>
          <div className="space-y-3">
            <Button
              type="submit"
              disabled={pending}
              className="inline-flex w-full items-center justify-center rounded-full border-2 border-transparent bg-[#7daf41] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#6b9a39] hover:shadow-md disabled:opacity-60"
            >
              {pending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t.resetting}
                </>
              ) : (
                t.submit
              )}
            </Button>
            <p className="text-center text-sm text-[#6b7280]">
              <Link href="/forgot-password" className="font-medium text-[#429ead] hover:underline">
                {t.requestNewLink}
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
