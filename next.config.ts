import type { Configuration } from 'webpack';

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'mrdupsekghsnbooyrdmj.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**'
      },
      {
        protocol: 'https',
        hostname: 'i.scdn.co',
        port: '',
        pathname: '/image/**'
      }
    ]
  },

  webpack: (config: Configuration) => {
    if (
      process.env.NODE_ENV === 'development' &&
      config.module?.rules
    ) {
      config.module.rules.push({
        test: /\.(jsx|tsx)$/,
        exclude: /node_modules/,
        enforce: 'pre',
        use: '@dyad-sh/nextjs-webpack-component-tagger'
      });
    }
    return config;
  }
};

export default nextConfig;