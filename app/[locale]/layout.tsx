import type { ReactNode } from 'react';
import {getMessages, setRequestLocale} from 'next-intl/server';
import {NextIntlClientProvider} from 'next-intl';
import {locales, defaultLocale} from '@/lib/i18n/config';
import { SWRConfig } from 'swr';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { toSafeUserDto } from '@/lib/dto/safe-user';
import '../globals.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale: rawLocale } = await params;
  const locale = (locales.includes(rawLocale as any) ? rawLocale : defaultLocale);

  setRequestLocale(locale);
  const messages = await getMessages();

  const [user, team] = await Promise.all([
    getUser().catch(() => null),
    getTeamForUser().catch(() => null),
  ]);
  const safeUser = toSafeUserDto(user);

  return (
    <SWRConfig
      value={{
        fallback: {
          '/api/user': safeUser,
          '/api/team': team,
        }
      }}
    >
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    </SWRConfig>
  );
}

