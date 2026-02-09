/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack configuration for Next.js 16+
  turbopack: {},

  // Exclude native modules from bundling
  serverExternalPackages: [
    '@lancedb/lancedb',
  ],

  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize native modules for server-side builds
      config.externals = config.externals || [];
      config.externals.push({
        '@lancedb/lancedb': 'commonjs @lancedb/lancedb',
      });
    }
    return config;
  },
};

export default nextConfig;
