import type { NextConfig } from "next";

// Determine if we're using Turbopack
const usingTurbopack = process.env.npm_lifecycle_script?.includes('--turbopack');

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true, // This will ignore all ESLint errors during build
  },
  
  // Add bundle analyzer in development mode, but only when not using Turbopack
  webpack: !usingTurbopack ? (config, { dev, isServer }) => {
    // Add bundle analyzer only in dev mode and not on the server
    if (dev && !isServer) {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'server',
          analyzerPort: 8888,
          openAnalyzer: false,
        })
      );
    }
    
    return config;
  } : undefined,
  
  // Optimize image handling
  images: {
    domains: ['localhost'],
    formats: ['image/avif', 'image/webp'],
  },
  
  // Optimize output for production
  output: 'standalone',
  
  // Add compression
  compress: true,
};

export default nextConfig;