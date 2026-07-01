"use client";

import { trpc } from "@/client/lib/trpc";

export function FriendsList() {
  const { data: friends, isPending } = trpc.friends.list.useQuery();

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="font-medium text-stone-900">Your correspondents</h2>

      {isPending ? (
        <p className="mt-3 text-sm text-stone-400">Loading…</p>
      ) : !friends || friends.length === 0 ? (
        <p className="mt-3 text-sm text-stone-400">
          No one yet. Share your invite link to connect.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-stone-100">
          {friends.map((f) => (
            <li key={f.id} className="py-2 text-sm text-stone-700">
              {f.name || f.email}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
