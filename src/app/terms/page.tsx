import type { Metadata } from 'next';
import { PlaceholderPage } from '@/components/PlaceholderPage';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Use FreeTierHunt at your own risk; offers are community-verified.',
};

export default function TermsPage() {
  return (
    <PlaceholderPage
      title="Terms of Service"
      subtitle="The boring contract. Short version: be cool, no warranty on offers, contact us before you sue."
      shipsIn="Hafta 10 Salı"
      preview={
        <ul className="space-y-2">
          <li>· Offers are community-verified, not endorsed by listed products.</li>
          <li>· Some links are affiliate links (clearly marked) — FTC compliant disclosure.</li>
          <li>· Takedown requests: hello@freetierhunt.com — we respond within 48h.</li>
          <li>· No warranty: an offer that worked yesterday may not today.</li>
        </ul>
      }
    />
  );
}
