/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize native modules for server-side builds
      config.externals = config.externals || [];
      config.externals.push({
        '@lancedb/lancedb': 'commonjs @lancedb/lancedb',
        'vectordb': 'commonjs vectordb',
      });
    }
    return config;
  },
};

export default nextConfig;
