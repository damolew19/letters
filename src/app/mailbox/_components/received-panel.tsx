"use client";

import Link from "next/link";
import { trpc } from "@/client/lib/trpc";

export function ReceivedPanel() {
  const received = trpc.letters.listReceived.useQuery();

  const letters = received.data ?? [];
  const unopened = letters.filter((l) => !l.openedAt).length;

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-medium text-stone-900">
          Received
          {unopened > 0 && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700"
              title={`${unopened} unopened letter${unopened === 1 ? "" : "s"}`}
            >
              <RedFlag />
              {unopened} new
            </span>
          )}
        </h2>
      </div>

      {received.isLoading ? (
        <p className="mt-4 text-sm text-stone-400">Loading your mail…</p>
      ) : letters.length === 0 ? (
        <p className="mt-4 text-sm text-stone-400">
          No letters yet. When a correspondent writes, their letter waits here.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-stone-100">
          {letters.map((l) => {
            const unread = !l.openedAt;
            return (
              <li key={l.id}>
                <Link
                  href={`/letter/${l.id}`}
                  className="flex items-center justify-between gap-4 py-3 transition-colors hover:bg-stone-50"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    {unread && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />
                    )}
                    <span className="min-w-0">
                      <span
                        className={`block truncate text-sm ${
                          unread
                            ? "font-medium text-stone-900"
                            : "text-stone-700"
                        }`}
                      >
                        From {l.senderName || l.senderEmail || "a correspondent"}
                      </span>
                      <span className="block text-xs text-stone-400">
                        Sealed{" "}
                        {l.sealedAt
                          ? new Date(l.sealedAt).toLocaleDateString()
                          : ""}
                      </span>
                    </span>
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                      unread
                        ? "bg-red-600 text-stone-50"
                        : "bg-stone-100 text-stone-500"
                    }`}
                  >
                    {unread ? "Unopened" : "Opened"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

// A raised mailbox flag, the signal that new mail is waiting.
function RedFlag() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
    >
      <path d="M3 1.5V11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path
        d="M3 2h6.2L7.6 4l1.6 2H3"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
