"use client";

import { useState } from "react";
import { trpc } from "@/client/lib/trpc";
import { Button } from "@/client/components/ui/button";

export function InvitePanel() {
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
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="font-medium text-stone-900">Invite a friend</h2>
      <p className="mt-1 text-sm text-stone-500">
        Share this link. Anyone who opens it and signs in becomes your
        correspondent.
      </p>

      <div className="mt-4 flex gap-2">
        <input
          readOnly
          value={isPending ? "Loading…" : (data?.url ?? "")}
          className="h-10 flex-1 rounded-lg border border-stone-300 bg-stone-50 px-3 text-sm text-stone-700 outline-none"
        />
        <Button
          onClick={copy}
          disabled={!data?.url}
          className="shrink-0 px-4"
        >
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>

      <Button
        variant="link"
        onClick={() => rotate.mutate()}
        disabled={rotate.isPending}
        className="mt-3 text-xs"
      >
        {rotate.isPending ? "Rotating…" : "Rotate link (revokes the old one)"}
      </Button>
    </section>
  );
}
