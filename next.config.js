/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'bqp.vn',
      },
      {
        protocol: 'http',
        hostname: 'bqp.vn',
      },
      {
        protocol: 'https',
        hostname: '*.bqp.vn',
      },
    ],
  },
};

module.exports = nextConfig;
