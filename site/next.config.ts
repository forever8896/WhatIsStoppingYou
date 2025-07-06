import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ['ipfs.io', 'aggregator.walrus-testnet.walrus.space'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'aggregator.walrus-testnet.walrus.space',
        port: '',
        pathname: '/v1/blobs/**',
      },
    ],
  },
};

export default nextConfig;
