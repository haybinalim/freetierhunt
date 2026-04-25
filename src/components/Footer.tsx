import Link from 'next/link';

const FOOTER_LINKS = [
  { label: 'About', href: '/about' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Contact', href: 'mailto:hello@freetierhunt.com' },
] as const;

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t-4 border-brutal-black bg-brutal-black text-brutal-yellow">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8 md:flex-row md:items-center md:justify-between">
        <div className="font-mono text-xs uppercase tracking-widest">
          © {year} FreeTierHunt · Built in public · Made for indie hackers
        </div>
        <nav className="flex flex-wrap gap-4">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="font-mono text-xs uppercase tracking-widest underline-offset-4 hover:underline"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
