/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Security headers handled in middleware.ts (CSP nonce per-request)
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'ph-files.imgix.net' },
      { protocol: 'https', hostname: '*.indiehackers.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.r2.cloudflarestorage.com' },
    ],
  },
  experimental: {
    // Server Actions enabled by default in Next 15
  },
  // Sentry config layered on top via withSentryConfig (added in Hafta 1 Cuma)
};

export default nextConfig;
