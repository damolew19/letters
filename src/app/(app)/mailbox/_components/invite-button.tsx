"use client";

import { useState } from "react";
import { trpc } from "@/client/lib/trpc";

export function InviteButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#e0d7c7] py-4 text-sm text-[#8a8178] transition-colors hover:border-[#d3c9b8] hover:bg-white/40 hover:text-[#6f665c]"
      >
        <span aria-hidden className="text-base leading-none">
          +
        </span>
        Invite a friend
      </button>

      {open && <InviteSheet onClose={() => setOpen(false)} />}
    </>
  );
}

function InviteSheet({ onClose }: { onClose: () => void }) {
  const utils = trpc.useUtils();
  const { data, isPending } = trpc.invite.getMyLink.useQuery();
  const rotate = trpc.invite.rotate.useMutation({
    onSuccess: () => utils.invite.getMyLink.invalidate(),
  });
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!data?.url) return;
    await navigator.clipboard.writeText(data.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-[#2b2621]/40 sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        className="w-full rounded-t-2xl bg-[#fffdf9] p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[0_-8px_40px_rgba(60,50,40,0.12)] sm:max-w-md sm:rounded-2xl sm:pb-6 sm:shadow-[0_20px_60px_rgba(60,50,40,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-serif text-xl text-[#2b2621]">Invite a friend</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg text-[#a89f95] transition-colors hover:bg-[#f4efe6] hover:text-[#6f665c]"
          >
            ×
          </button>
        </div>
        <p className="mt-2 text-sm text-[#8a8178]">
          Share this link. Anyone who opens it and signs in becomes your
          correspondent.
        </p>

        <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#e7e0d6] bg-[#faf7f2] p-2">
          <input
            readOnly
            value={data?.url ?? (isPending ? "Loading…" : "")}
            onFocus={(e) => e.currentTarget.select()}
            className="min-w-0 flex-1 bg-transparent px-2 text-sm text-[#6f665c] outline-none"
          />
          <button
            type="button"
            onClick={copy}
            disabled={!data?.url}
            className="shrink-0 rounded-lg bg-[#2b2621] px-3 py-1.5 text-sm font-medium text-[#faf7f2] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        <button
          type="button"
          onClick={() => rotate.mutate()}
          disabled={rotate.isPending}
          className="mt-3 text-xs text-[#a89f95] underline underline-offset-4 transition-colors hover:text-[#6f665c] disabled:opacity-60"
        >
          {rotate.isPending ? "Rotating…" : "Rotate link (revokes the old one)"}
        </button>
      </div>
    </div>
  );
}
