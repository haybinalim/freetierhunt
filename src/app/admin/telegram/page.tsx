import type { Metadata } from 'next';
import Link from 'next/link';
import { desc } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { telegramInboundUpdates } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/admin/guard';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Telegram ingress · Admin',
  robots: { index: false, follow: false },
};

const STATUS_STYLE: Record<string, string> = {
  received: 'bg-brutal-yellow',
  accepted: 'bg-brutal-green',
  ignored: 'bg-brutal-white',
  rejected: 'bg-brutal-red text-brutal-white',
};

export default async function AdminTelegramPage() {
  await requireAdmin();
  const updates = await db
    .select()
    .from(telegramInboundUpdates)
    .orderBy(desc(telegramInboundUpdates.receivedAt))
    .limit(100);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <header className="border-3 border-brutal-black bg-brutal-white p-6 shadow-brutal-lg md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-brutal-black/60">
              Admin
            </p>
            <h1 className="mt-3 font-mono text-3xl font-bold uppercase tracking-tight md:text-4xl">
              Telegram ingress
            </h1>
            <p className="mt-2 max-w-3xl font-mono text-xs uppercase tracking-widest text-brutal-black/60">
              Authorized channel commands only · raw message text is never stored · accepted entries
              await evidence review
            </p>
          </div>
          <Link
            href="/admin/submissions"
            className="border-2 border-brutal-black bg-brutal-yellow px-3 py-2 font-mono text-xs font-bold uppercase tracking-widest shadow-brutal"
          >
            Review submissions →
          </Link>
        </div>
      </header>

      <section className="mt-8 border-3 border-brutal-black bg-brutal-white p-5 shadow-brutal">
        <h2 className="font-mono text-lg font-bold uppercase tracking-tight">
          Channel command format
        </h2>
        <p className="mt-2 font-mono text-xs text-brutal-black/70">
          <code className="break-all bg-brutal-yellow px-1.5 py-1">
            /offer credit | Product name | Concise headline |
            https://official-provider.example/offer | Exact proof quote
          </code>
        </p>
        <p className="mt-3 text-sm text-brutal-black/70">
          Accepted types are <code>free_tier</code>, <code>trial</code>, <code>credit</code> and{' '}
          <code>discount</code>. The official URL and proof quote are sent to the normal evidence
          review queue; no post is published automatically.
        </p>
      </section>

      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-mono text-xl font-bold uppercase tracking-tight">Recent updates</h2>
          <span className="font-mono text-xs uppercase tracking-widest text-brutal-black/60">
            {updates.length} updates
          </span>
        </div>

        {updates.length === 0 ? (
          <p className="mt-4 border-3 border-dashed border-brutal-black/40 bg-brutal-white p-6 font-mono text-sm">
            No webhook updates have been received. Configure the bot webhook and add its authorized
            channel ID before testing.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto border-3 border-brutal-black bg-brutal-white shadow-brutal">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead className="border-b-3 border-brutal-black bg-brutal-yellow font-mono text-[10px] font-bold uppercase tracking-widest">
                <tr>
                  <th className="p-3">Received</th>
                  <th className="p-3">Chat</th>
                  <th className="p-3">Official URL</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Reason / submission</th>
                </tr>
              </thead>
              <tbody>
                {updates.map((update) => (
                  <tr key={update.id} className="border-b-2 border-brutal-black/20 last:border-0">
                    <td className="p-3 align-top font-mono text-xs">
                      {new Date(update.receivedAt).toLocaleString()}
                    </td>
                    <td className="p-3 align-top">
                      <p className="font-mono text-xs font-bold">
                        {update.chatTitle ?? 'Untitled channel'}
                      </p>
                      <p className="mt-1 font-mono text-[10px] text-brutal-black/60">
                        {update.chatId}
                      </p>
                    </td>
                    <td className="p-3 align-top">
                      {update.officialUrl ? (
                        <a
                          href={update.officialUrl}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="text-brutal-blue block max-w-[340px] truncate font-mono text-xs underline"
                        >
                          {update.officialUrl}
                        </a>
                      ) : (
                        <span className="font-mono text-xs text-brutal-black/60">Not stored</span>
                      )}
                    </td>
                    <td className="p-3 align-top">
                      <span
                        className={`inline-block border-2 border-brutal-black px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest ${STATUS_STYLE[update.status]}`}
                      >
                        {update.status}
                      </span>
                    </td>
                    <td className="p-3 align-top font-mono text-xs">
                      {update.submissionId ? (
                        <Link href="/admin/submissions" className="font-bold underline">
                          Submission #{update.submissionId} → review
                        </Link>
                      ) : (
                        (update.reason ?? '—')
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
