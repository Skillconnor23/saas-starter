import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/pricing-students", destination: "/pricing", permanent: true },
      { source: "/pricing-schools", destination: "/schools/pricing", permanent: true },
    ];
  },
  turbopack: {
    root: __dirname,
  },
  experimental: {
    ppr: true,
    clientSegmentCache: true,
    serverActions: {
      bodySizeLimit: '12mb',
    },
  },
};

export default withNextIntl(nextConfig);
