import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

export default nextConfig;
