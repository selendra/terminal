/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Enable standalone output for Docker
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'selendra.org',
      },
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
      },
    ],
    unoptimized: true, // Required for standalone mode
  },
  // Turbopack configuration (Next.js 16+)
  turbopack: {
    resolveAlias: {
      // Handle WebSocket/Node.js modules for Substrate provider
      fs: { browser: './empty-module.js' },
      net: { browser: './empty-module.js' },
      tls: { browser: './empty-module.js' },
    },
  },
  // Webpack fallback for older builds
  webpack: (config, { isServer }) => {
    // Handle WebSocket for Substrate provider
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
