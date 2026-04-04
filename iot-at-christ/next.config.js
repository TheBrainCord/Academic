/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Prevent webpack from bundling server-only Node.js packages
    serverComponentsExternalPackages: [
      '@anthropic-ai/sdk',
      'resend',
      '@supabase/ssr',
      '@supabase/supabase-js',
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
