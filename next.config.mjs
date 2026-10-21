import { withPayload } from '@payloadcms/next/withPayload';

/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'muzbzrxwbanzsjvgtexp.supabase.co',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/blog',
        destination: '/insights/',
        permanent: true,
      },
      {
        source: '/blog/',
        destination: '/insights/',
        permanent: true,
      },
      {
        source: '/blog/:slug',
        destination: '/insights/:slug/',
        permanent: true,
      },
      {
        source: '/blog/:slug/',
        destination: '/insights/:slug/',
        permanent: true,
      },
    ];
  },
};

export default withPayload(nextConfig);
