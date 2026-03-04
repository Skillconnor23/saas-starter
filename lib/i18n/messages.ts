import type { Locale } from './config';
import en from '@/messages/en.json';
import mn from '@/messages/mn.json';

type Messages = typeof en;

function deepMerge<T extends Record<string, any>>(base: T, override: Partial<T>): T {
  const result: Record<string, any> = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      typeof base[key] === 'object' &&
      base[key] !== null
    ) {
      result[key] = deepMerge(base[key], value as any);
    } else if (value !== undefined) {
      result[key] = value;
    }
  }
  return result as T;
}

export function getMessagesForLocale(locale: Locale): Messages {
  switch (locale) {
    case 'mn':
      // Fallback behavior: start from English and override with Mongolian keys.
      // Missing Mongolian keys will transparently use English copies.
      return deepMerge(en, mn as unknown as Partial<Messages>);
    case 'en':
    default:
      return en;
  }
}

