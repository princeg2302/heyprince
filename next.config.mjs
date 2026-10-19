import { withPayload } from '@payloadcms/next/withPayload';

/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true,
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
