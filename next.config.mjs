import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Security headers handled in middleware.ts (CSP nonce per-request)
  images: {
    remotePatterns: [
      // Product / source images
      { protocol: 'https', hostname: 'ph-files.imgix.net' },
      { protocol: 'https', hostname: '*.indiehackers.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.r2.cloudflarestorage.com' },
      // Favicon services (used as logo fallback for products)
      { protocol: 'https', hostname: 'icons.duckduckgo.com' },
      { protocol: 'https', hostname: 'www.google.com', pathname: '/s2/favicons/**' },
      { protocol: 'https', hostname: 'cdn.simpleicons.org' },
    ],
    // Modern formats for smaller bundles
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    // Server Actions enabled by default in Next 15
  },
};

/**
 * Sentry build-time config. Source map upload only runs when SENTRY_AUTH_TOKEN
 * is set (CI/Vercel). Local builds skip uploads silently.
 */
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: '/monitoring', // bypass ad-blockers
  hideSourceMaps: true,
});
