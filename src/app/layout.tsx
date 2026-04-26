import type { Metadata } from 'next';
import { IBM_Plex_Mono, Inter } from 'next/font/google';
import { CookieBanner } from '@/components/CookieBanner';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { SearchCommand } from '@/components/SearchCommand';
import { env } from '@/lib/env';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plex-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'FreeTierHunt — Free credits, trials & promo codes for AI tools',
    template: '%s | FreeTierHunt',
  },
  description:
    'Discover free tiers, generous trials, and verified promo codes for the AI tools you actually use. Curated daily.',
  metadataBase: new URL(env.SITE_URL),
  openGraph: {
    type: 'website',
    siteName: 'FreeTierHunt',
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@freetierhunt',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${plexMono.variable}`}>
      <body className="flex min-h-screen flex-col bg-brutal-yellow font-sans text-brutal-black antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <SearchCommand />
        <CookieBanner />
      </body>
    </html>
  );
}
