import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Nunito } from 'next/font/google';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { SWRConfig } from 'swr';

export const metadata: Metadata = {
  title: 'Next.js SaaS Starter',
  description: 'Get started quickly with Next.js, Postgres, and Stripe.'
};

export const viewport: Viewport = {
  maximumScale: 1
};

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700']
});

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const [user, team] = await Promise.all([
    getUser().catch(() => null),
    getTeamForUser().catch(() => null),
  ]);
  return (
    <html lang="en" className="bg-white dark:bg-gray-950 text-black dark:text-white">
      <body className={`min-h-[100dvh] bg-white ${nunito.className}`}>
        <SWRConfig
          value={{
            fallback: {
              '/api/user': user,
              '/api/team': team,
            }
          }}
        >
          {children}
        </SWRConfig>
      </body>
    </html>
  );
}
