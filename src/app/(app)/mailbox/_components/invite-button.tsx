"use client";

import { useState } from "react";
import { DialogTrigger, Heading } from "react-aria-components";
import { Button } from "@/client/components/ui/button";
import { Modal } from "@/client/components/ui/modal";
import { TextField } from "@/client/components/ui/text-field";
import { trpc } from "@/client/lib/trpc";

export function InviteButton() {
  return (
    <DialogTrigger>
      <Button
        variant="unstyled"
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#e0d7c7] py-4 text-sm text-[#8a8178] outline-none transition-colors hover:border-[#d3c9b8] hover:bg-white/40 hover:text-[#6f665c]"
      >
        <span aria-hidden className="text-base lead`ing-none">
          +
        </span>
        Invite a friend
      </Button>

      <Modal variant="sheet">
        {({ close }) => <InviteSheet onClose={close} />}
      </Modal>
    </DialogTrigger>
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
    <>
      <div className="flex items-start justify-between gap-4">
        <Heading slot="title" className="font-serif text-xl text-[#2b2621]">
          Invite a friend
        </Heading>
        <Button
          variant="unstyled"
          onPress={onClose}
          aria-label="Close"
          className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg text-[#a89f95] outline-none transition-colors hover:bg-[#f4efe6] hover:text-[#6f665c]"
        >
          ×
        </Button>
      </div>
      <p className="mt-2 text-sm text-[#8a8178]">
        Share this link. Anyone who opens it and signs in becomes your
        correspondent.
      </p>

      <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#e7e0d6] bg-[#faf7f2] p-2">
        <TextField
          aria-label="Invite link"
          value={data?.url ?? (isPending ? "Loading…" : "")}
          className="min-w-0 flex-1"
          inputClassName="w-full bg-transparent px-2 text-sm text-[#6f665c] outline-none"
          inputProps={{
            readOnly: true,
            onFocus: (e) => e.currentTarget.select(),
          }}
        />
        <Button
          variant="unstyled"
          onPress={copy}
          isDisabled={!data?.url}
          className="shrink-0 rounded-lg bg-[#2b2621] px-3 py-1.5 text-sm font-medium text-[#faf7f2] outline-none transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>

      <Button
        variant="unstyled"
        onPress={() => rotate.mutate()}
        isDisabled={rotate.isPending}
        className="mt-3 text-xs text-[#a89f95] underline underline-offset-4 outline-none transition-colors hover:text-[#6f665c] disabled:opacity-60"
      >
        {rotate.isPending ? "Rotating…" : "Rotate link (revokes the old one)"}
      </Button>
    </>
  );
}
