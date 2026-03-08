import { redirectWithLocale } from '@/lib/i18n/redirect';

/** Legacy route – redirect to modern dashboard. */
export default async function ClassHubRedirect() {
  await redirectWithLocale('/dashboard');
}
