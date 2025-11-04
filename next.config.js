/** @type {import('next').NextConfig} */
const path = require('path');
const nextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  experimental: {
    turbo: {
      resolveAlias: {
        '@react-native-async-storage/async-storage': path.resolve(__dirname, 'lib/stubs/async-storage.ts'),
      },
    },
  },
};

module.exports = nextConfig;
