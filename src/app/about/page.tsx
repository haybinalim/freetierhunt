import type { Metadata } from 'next';
import { PlaceholderPage } from '@/components/PlaceholderPage';

export const metadata: Metadata = {
  title: 'About',
  description: 'Why FreeTierHunt exists — saving indie makers $80+/month on AI tools.',
};

export default function AboutPage() {
  return (
    <PlaceholderPage
      title="About"
      subtitle="Built by an indie hacker who got tired of paying $80/mo for AI subscriptions."
      shipsIn="Hafta 10 Salı"
      preview={
        <ul className="space-y-2">
          <li>· One-person project, build-in-public on X.</li>
          <li>· Powered by an autonomous agent + the indie maker community.</li>
          <li>· $0 budget, free tier across the entire stack.</li>
          <li>· Open invitation: spot a missing offer? Submit it.</li>
        </ul>
      }
    />
  );
}
