"use client";

import { trpc } from "@/client/lib/trpc";

export function SentPanel() {
  const sent = trpc.letters.listSent.useQuery();

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="font-medium text-stone-900">Sent</h2>

      {sent.isLoading ? (
        <p className="mt-4 text-sm text-stone-400">Loading sent letters…</p>
      ) : (sent.data?.length ?? 0) === 0 ? (
        <p className="mt-4 text-sm text-stone-400">
          No sent letters yet. Sealed letters appear here.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-stone-100">
          {sent.data!.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-4 py-3"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm text-stone-900">
                  To {s.recipientName || s.recipientEmail || "a correspondent"}
                </span>
                <span className="block text-xs text-stone-400">
                  Sealed{" "}
                  {s.sealedAt
                    ? new Date(s.sealedAt).toLocaleDateString()
                    : ""}
                </span>
              </span>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                  s.openedAt
                    ? "bg-stone-900 text-stone-50"
                    : "bg-stone-100 text-stone-500"
                }`}
              >
                {s.openedAt ? "Opened" : "Delivered"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
