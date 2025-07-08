import { withTamagui } from '@tamagui/next-plugin'
import type { Configuration } from 'webpack';

const tamaguiPlugin = withTamagui({
  config: './tamagui.config.ts',
  components: ['tamagui'],
  importsWhitelist: ['constants.js', 'colors.js'],
  outputCSS: process.env.NODE_ENV === 'production' ? './public/tamagui.css' : null,
  logTimings: true,
  disableExtraction: process.env.NODE_ENV === 'development',
});

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
  },
  transpilePackages: ['react-native-web'],
};

export default tamaguiPlugin(nextConfig);