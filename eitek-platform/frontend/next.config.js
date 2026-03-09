/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  env: {
    API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3001',
    WEBSOCKET_URL: process.env.WEBSOCKET_URL || 'ws://localhost:3001',
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001',
    NEXT_PUBLIC_THINGSBOARD_API_URL: process.env.NEXT_PUBLIC_THINGSBOARD_API_URL || 'http://localhost:8080',
  },
  webpack: (config, { isServer }) => {
    // Handle canvas module for Konva
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('canvas');
    }
    
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || 'http://localhost:3001'}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;