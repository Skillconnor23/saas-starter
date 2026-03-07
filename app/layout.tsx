import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Nunito } from 'next/font/google';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { SWRConfig } from 'swr';

export const metadata: Metadata = {
  title: 'Gecko Academy',
  description: 'Join a live English class with Gecko Academy.',
  openGraph: {
    title: 'Gecko Academy',
    description: 'Join a live English class with Gecko Academy.',
    url: 'https://www.geckoacademy.net',
    siteName: 'Gecko Academy',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Gecko Academy',
      },
    ],
    type: 'website',
  },
  icons: {
    icon: '/favicon.ico',
  },
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
