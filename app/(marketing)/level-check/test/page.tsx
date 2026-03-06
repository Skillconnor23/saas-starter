import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { requireAuth } from '@/lib/auth/user';
import { PlacementTest } from '@/components/level-check/PlacementTest';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LevelCheckTestPage() {
  const user = await requireAuth();
  const locale = await getLocale();

  return (
    <div className="mx-auto max-w-2xl">
      <Button variant="ghost" size="sm" asChild className="mb-4 -ml-1">
        <Link
          href={`/${locale}/level-check`}
          className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Level Check
        </Link>
      </Button>
      <PlacementTest />
    </div>
  );
}
