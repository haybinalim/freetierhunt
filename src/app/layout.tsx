import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'FreeTierHunt — Free credits, trials & promo codes for AI tools',
    template: '%s | FreeTierHunt',
  },
  description:
    'Discover free tiers, generous trials, and verified promo codes for the AI tools you actually use. Curated daily.',
  metadataBase: new URL(process.env.SITE_URL ?? 'http://localhost:3000'),
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
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-brutal-yellow font-display text-brutal-black antialiased">
        {children}
      </body>
    </html>
  );
}
