/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output standalone for optimal Vercel/Docker deploys
  output: 'standalone',

  experimental: {
    // Server Actions are stable in Next.js 14 — no flag needed
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',  // Google OAuth avatars
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',              // Supabase Storage avatars
      },
    ],
  },

  // Silence Supabase realtime WebSocket warnings in build output
  webpack(config) {
    config.resolve.fallback = { ...config.resolve.fallback, net: false, tls: false }
    return config
  },
}

module.exports = nextConfig
