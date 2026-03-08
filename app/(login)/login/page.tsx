import { redirectWithLocale } from '@/lib/i18n/redirect';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LoginPage() {
  await redirectWithLocale('/sign-in');
}
