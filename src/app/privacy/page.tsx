import type { Metadata } from 'next';
import { PlaceholderPage } from '@/components/PlaceholderPage';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How FreeTierHunt handles your data — short, plain English.',
};

export default function PrivacyPage() {
  return (
    <PlaceholderPage
      title="Privacy Policy"
      subtitle="Plain-English summary of how we handle data."
      shipsIn="Hafta 10 Salı"
      preview={
        <ul className="space-y-2">
          <li>· No tracking cookies unless you accept analytics.</li>
          <li>· We never sell or share email addresses.</li>
          <li>· Right to access / export / delete is always one click.</li>
          <li>· Hosted on EU + US infrastructure (Vercel, Supabase).</li>
        </ul>
      }
    />
  );
}
