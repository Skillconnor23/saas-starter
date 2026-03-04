'use client';

import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { localeCookieName, locales, type Locale } from '@/lib/i18n/config';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const SUPPORTED = [
  { locale: 'en', label: 'English', short: 'EN' },
  { locale: 'mn', label: 'Монгол', short: 'MN' },
] as const;

function buildPathWithLocale(pathname: string, targetLocale: Locale): string {
  const segments = pathname.split('/');
  if (segments.length > 1 && locales.includes(segments[1] as Locale)) {
    segments[1] = targetLocale;
    return segments.join('/') || `/${targetLocale}`;
  }
  const rest = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `/${targetLocale}${rest}`;
}

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const pathname = usePathname() || '/';
  const searchParams = useSearchParams();
  const router = useRouter();

  const current =
    SUPPORTED.find((entry) => entry.locale === locale) ?? SUPPORTED[0];
  const label = `${current.label} (${current.short})`;

  function handleSelect(nextLocale: Locale) {
    if (nextLocale === locale) return;

    // Persist the locale so direct visits go to the chosen language.
    document.cookie = `${localeCookieName}=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;

    const basePath = buildPathWithLocale(pathname, nextLocale);
    const query = searchParams.toString();
    const nextUrl = query ? `${basePath}?${query}` : basePath;

    router.replace(nextUrl);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700"
        >
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {SUPPORTED.map((entry) => (
          <DropdownMenuItem
            key={entry.locale}
            onClick={() => handleSelect(entry.locale as Locale)}
          >
            {entry.label} ({entry.short})
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

