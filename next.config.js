/** @type {import('next').NextConfig} */
const nextConfig = {
  // Default tetap '.next' untuk produksi; mode dev memakai '.next-dev' agar tidak merusak build produksi
  distDir: process.env.NEXT_DIST_DIR || (process.env.NODE_ENV === 'development' ? '.next-dev' : '.next'),
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fkycaekjwdcbfyengmco.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    scrollRestoration: true,
  },
  swcMinify: true,
  async headers() {
    return [
      {
        source: '/uploads/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: '*' },
        ],
      },
    ];
  },
}

module.exports = nextConfig
