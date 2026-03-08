import { redirectWithLocale } from '@/lib/i18n/redirect';

/** Legacy route – redirect to modern admin dashboard. */
export default async function AdminClassRedirect() {
  await redirectWithLocale('/dashboard');
}
