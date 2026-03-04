import {getRequestConfig} from 'next-intl/server';
import {locales, defaultLocale} from '@/lib/i18n/config';
import {getMessagesForLocale} from '@/lib/i18n/messages';

export default getRequestConfig(async ({ locale, requestLocale }) => {
  // Use requestLocale (from [locale] segment / setRequestLocale) when locale override is not passed
  const requested = locale ?? (await requestLocale);
  const resolvedLocale =
    requested && locales.includes(requested as (typeof locales)[number])
      ? (requested as (typeof locales)[number])
      : defaultLocale;

  const messages = getMessagesForLocale(resolvedLocale);

  return {
    locale: resolvedLocale,
    messages
  };
});

