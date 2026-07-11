"use client";

import { DialogTrigger } from "react-aria-components";
import { Button } from "@/client/components/ui/button";
import { Modal } from "@/client/components/ui/modal";
import { InviteSheet } from "./invite-sheet";

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
