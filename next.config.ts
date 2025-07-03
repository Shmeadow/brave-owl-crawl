/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Enables static HTML export for GitHub Pages

  basePath: '/brave-owl-crawl', // Required so routing works at your GitHub Pages path
  assetPrefix: '/brave-owl-crawl', // Ensures static assets load correctly (e.g. _next/*, images, etc.)

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

  webpack: (config: import('webpack').Configuration) => {
    if (process.env.NODE_ENV === 'development') {
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