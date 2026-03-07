'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { signIn, signUp, resendVerificationEmail } from './actions';
import { ActionState } from '@/lib/auth/middleware';

const AUTH_ERROR_KEYS = ['invalidCredentials', 'emailNotVerified', 'createUserFailed', 'createTeamFailed', 'invalidOrExpiredInvitation'] as const;

export function Login({ mode = 'signin' }: { mode?: 'signin' | 'signup' }) {
  const t = useTranslations('auth.login');
  const tNav = useTranslations('nav');
  const tErrors = useTranslations('errors.auth');
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const priceId = searchParams.get('priceId');
  const inviteId = searchParams.get('inviteId');
  const prefilledEmail = searchParams.get('email');
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    mode === 'signin' ? signIn : signUp,
    { error: '' }
  );

  const title = mode === 'signin' ? t('title.signin') : t('title.signup');
  const subtitle = mode === 'signin' ? t('subtitle.signin') : t('subtitle.signup');
  const errorMessage = state?.error && AUTH_ERROR_KEYS.includes(state.error as (typeof AUTH_ERROR_KEYS)[number])
    ? tErrors(state.error as (typeof AUTH_ERROR_KEYS)[number])
    : state?.error;
  const showResendVerification = mode === 'signin' && state?.error === 'emailNotVerified';
  const [resendState, resendFormAction, resendPending] = useActionState(
    resendVerificationEmail,
    null as { success?: boolean; error?: string } | null
  );

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-[#fafbfc] px-4 py-10 sm:px-6 lg:px-8">
      <div className="w-full max-w-md rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-[0_4px_24px_rgba(15,23,42,0.06)] sm:p-8">
        {/* Brand lockup */}
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#e5e7eb] bg-white">
              <Image
                src="/gecko-logo.svg"
                alt={tNav('brand')}
                width={120}
                height={120}
                sizes="40px"
                className="h-10 w-10 object-contain"
                unoptimized
              />
            </div>
            <span className="text-base font-semibold text-[#1f2937]">
              {tNav('brand')}
            </span>
          </div>
          <h1 className="mt-6 text-xl sm:text-2xl font-semibold tracking-tight text-[#111827]">
            {title}
          </h1>
          <p className="mt-2 text-sm text-[#6b7280]">
            {subtitle}
          </p>
        </div>

        {/* Verification notice – rounded panel when email not verified */}
        {showResendVerification && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-[#f59e0b]/30 bg-[#fffbeb] px-4 py-4"
          >
            <p className="text-sm font-medium text-[#92400e]">
              {errorMessage}
            </p>
            <p className="mt-1.5 text-sm text-[#a16207]">
              {t('resendVerificationHint')}
            </p>
            <form action={resendFormAction} className="mt-3">
              <input type="hidden" name="email" value={state?.email ?? ''} />
              <Button
                type="submit"
                variant="outline"
                size="sm"
                disabled={resendPending || !state?.email}
                className="h-8 rounded-full border-[#429ead] bg-white text-[#429ead] hover:bg-[#429ead]/10 hover:text-[#388694]"
              >
                {resendPending ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    {t('resendVerificationSending')}
                  </>
                ) : (
                  t('resendVerificationCta')
                )}
              </Button>
            </form>
            {resendState?.success && (
              <p className="mt-3 text-sm font-medium text-[#7daf41]">
                {t('resendVerificationSuccess')}
              </p>
            )}
          </div>
        )}

        {/* Generic error – inline, not verification */}
        {errorMessage && !showResendVerification && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3"
          >
            <p className="text-sm font-medium text-[#b64b29]">
              {errorMessage}
            </p>
          </div>
        )}

        {/* Form */}
        <form className="mt-8 space-y-5" action={formAction}>
          <input type="hidden" name="redirect" value={redirect || ''} />
          <input type="hidden" name="priceId" value={priceId || ''} />
          <input type="hidden" name="inviteId" value={inviteId || ''} />

          <div className="space-y-1.5">
            <Label
              htmlFor="email"
              className="block text-sm font-medium text-[#374151]"
            >
              {t('emailLabel')}
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              defaultValue={state?.email ?? prefilledEmail ?? ''}
              required
              maxLength={50}
              className="w-full rounded-full border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#111827] placeholder:text-gray-400 shadow-[0_1px_2px_rgba(15,23,42,0.04)] focus-visible:border-[#7daf41] focus-visible:ring-2 focus-visible:ring-[#7daf41] focus-visible:ring-offset-0"
              placeholder={t('emailPlaceholder')}
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="password"
              className="block text-sm font-medium text-[#374151]"
            >
              {t('passwordLabel')}
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={
                mode === 'signin' ? 'current-password' : 'new-password'
              }
              defaultValue={state.password}
              required
              minLength={8}
              maxLength={100}
              className="w-full rounded-full border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#111827] placeholder:text-gray-400 shadow-[0_1px_2px_rgba(15,23,42,0.04)] focus-visible:border-[#7daf41] focus-visible:ring-2 focus-visible:ring-[#7daf41] focus-visible:ring-offset-0"
              placeholder={t('passwordPlaceholder')}
            />
          </div>

          <div className="space-y-3">
            {mode === 'signin' && (
              <p className="text-center text-sm text-[#6b7280]">
                <Link
                  href="/forgot-password"
                  className="font-medium text-[#429ead] hover:underline"
                >
                  {t('forgotPassword')}
                </Link>
              </p>
            )}
            <Button
              type="submit"
              disabled={pending}
              className="inline-flex w-full items-center justify-center rounded-full border-2 border-transparent bg-[#7daf41] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:border-[#7daf41] hover:bg-[#6b9a39] hover:shadow-md disabled:opacity-60 disabled:shadow-none"
            >
              {pending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('loading')}
                </>
              ) : mode === 'signin' ? (
                t('submit.signin')
              ) : (
                t('submit.signup')
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              {mode === 'signin' ? (
                <>
                  {t('switchToSignup')}{' '}
                  <Link
                    href={`/sign-up${redirect ? `?redirect=${redirect}` : ''}${priceId ? `&priceId=${priceId}` : ''}`}
                    className="font-medium text-[#429ead] hover:underline"
                  >
                    {t('switchToSignupCta')}
                  </Link>
                </>
              ) : (
                <>
                  {t('switchToSignin')}{' '}
                  <Link
                    href={`/sign-in${redirect ? `?redirect=${redirect}` : ''}${priceId ? `&priceId=${priceId}` : ''}`}
                    className="font-medium text-[#429ead] hover:underline"
                  >
                    {t('switchToSigninCta')}
                  </Link>
                </>
              )}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
