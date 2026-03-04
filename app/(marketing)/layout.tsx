'use client';

import { usePathname } from 'next/navigation';
import { MarketingHeader } from '@/components/layout/MarketingHeader';

/** Single marketing layout: header (logo → /, nav, user menu) + scrollable main. Header hidden on /trial for minimal distraction. */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isTrialPage = pathname === '/trial';

  return (
    <div className="min-h-screen bg-white">
      {!isTrialPage && (
        <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur-sm">
          <MarketingHeader />
        </header>
      )}
      <main className="w-full">{children}</main>
    </div>
  );
}
