const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Silence the "multiple lockfiles / workspace root" warning
  outputFileTracingRoot: path.join(__dirname),
  // Prevent webpack from bundling server-only Node.js packages (Next.js 15 key)
  serverExternalPackages: [
    '@anthropic-ai/sdk',
    'resend',
    '@supabase/ssr',
    '@supabase/supabase-js',
  ],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
