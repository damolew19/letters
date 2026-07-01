"use client";

import { useRouter } from "next/navigation";
import { trpc } from "@/client/lib/trpc";

export function DraftsPanel() {
  const router = useRouter();
  const drafts = trpc.letters.listDrafts.useQuery();
  const createDraft = trpc.letters.createDraft.useMutation({
    onSuccess: ({ id }) => router.push(`/compose/${id}`),
  });

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-stone-900">Drafts</h2>
        <button
          onClick={() => createDraft.mutate()}
          disabled={createDraft.isPending}
          className="inline-flex h-9 items-center justify-center rounded-full bg-stone-900 px-4 text-sm font-medium text-stone-50 transition-colors hover:bg-stone-700 disabled:opacity-60"
        >
          {createDraft.isPending ? "Opening…" : "Write a letter"}
        </button>
      </div>

      {drafts.isLoading ? (
        <p className="mt-4 text-sm text-stone-400">Loading drafts…</p>
      ) : (drafts.data?.length ?? 0) === 0 ? (
        <p className="mt-4 text-sm text-stone-400">
          No drafts yet. Start a letter to your correspondents.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-stone-100">
          {drafts.data!.map((d) => (
            <li key={d.id}>
              <button
                onClick={() => router.push(`/compose/${d.id}`)}
                className="flex w-full items-center justify-between gap-4 py-3 text-left transition-colors hover:bg-stone-50"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm text-stone-900">
                    {d.excerpt?.trim() || "Empty letter"}
                  </span>
                  <span className="block text-xs text-stone-400">
                    {d.recipientName || d.recipientEmail
                      ? `To ${d.recipientName || d.recipientEmail}`
                      : "No correspondent yet"}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-stone-400">
                  {new Date(d.updatedAt).toLocaleDateString()}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
