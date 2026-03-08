import './globals.css';
import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { toSafeUserDto } from '@/lib/dto/safe-user';
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

const nunito = localFont({
  src: './fonts/Nunito-VariableFont_wght.ttf',
  variable: '--font-nunito',
  weight: '100 900',
  display: 'swap',
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
  const safeUser = toSafeUserDto(user);
  return (
    <html lang="en" className={`${nunito.className} ${nunito.variable} bg-white dark:bg-gray-950 text-black dark:text-white`}>
      <body className={`${nunito.className} ${nunito.variable} min-h-[100dvh] bg-white antialiased`}>
        <SWRConfig
          value={{
            fallback: {
              '/api/user': safeUser,
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
