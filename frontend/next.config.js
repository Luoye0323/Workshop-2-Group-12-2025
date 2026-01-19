/** @type {import('next').NextConfig} */
const nextConfig = {
  // CRITICAL: Enables standalone output for Docker
  output: 'standalone',
  
  experimental: {
    // Disable SWC minifier to avoid binary issues
    swcMinify: false,
  },
  
  // Configure webpack to handle native modules
  webpack: (config, { isServer }) => {
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
  
  // Proxy API calls to backend
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://backend:5000/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;