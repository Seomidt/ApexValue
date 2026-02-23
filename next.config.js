/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    instrumentationHook: true,
    serverComponentsExternalPackages: ['@libsql/client', '@libsql/client/node'],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.r2.cloudflarestorage.com' },
      { protocol: 'https', hostname: 'pub-*.r2.dev' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/app',
        destination: process.env.APP_BASE_URL || 'http://localhost:3000',
        permanent: false,
      },
      {
        source: '/app/:path*',
        destination: `${process.env.APP_BASE_URL || 'http://localhost:3000'}/:path*`,
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
