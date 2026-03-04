import type { ReactNode } from 'react';
import {getMessages, setRequestLocale} from 'next-intl/server';
import {NextIntlClientProvider} from 'next-intl';
import {locales, defaultLocale} from '@/lib/i18n/config';
import { Nunito } from 'next/font/google';
import { SWRConfig } from 'swr';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import '../globals.css';

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700']
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale: rawLocale } = await params;
  const locale = (locales.includes(rawLocale as any) ? rawLocale : defaultLocale);

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <SWRConfig
      value={{
        fallback: {
          '/api/user': getUser(),
          '/api/team': getTeamForUser()
        }
      }}
    >
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    </SWRConfig>
  );
}

