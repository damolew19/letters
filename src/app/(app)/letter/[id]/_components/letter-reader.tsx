"use client";

import { useState } from "react";
import { AnimatePresence } from "motion/react";
import { type JSONContent } from "@tiptap/react";
import { Button } from "@/client/components/ui/button";
import { trpc } from "@/client/lib/trpc";
import { prefersReducedMotion } from "@/client/lib/motion";
import { EnvelopeOpen } from "./envelope-open";
import { SealedEnvelope } from "./sealed-envelope";
import { RevealedLetter } from "./revealed-letter";
import { LetterNotFound } from "./letter-not-found";

type Phase = "sealed" | "opening" | "open";

export function LetterReader({ letterId }: { letterId: string }) {
  const utils = trpc.useUtils();
  const letter = trpc.letters.getReceived.useQuery({ id: letterId });
  const [phase, setPhase] = useState<Phase>("sealed");

  const markOpened = trpc.letters.markOpened.useMutation({
    onSuccess: () => {
      utils.letters.listReceived.invalidate();
      utils.letters.listSent.invalidate();
      utils.letters.getReceived.invalidate({ id: letterId });
    },
  });

  // Once the letter has already been opened, skip straight to the body so the
  // keepsake re-reads without replaying the ceremony. Derived (not stored) so
  // it reconciles when the query resolves without a cascading effect.
  const alreadyOpened = !!letter.data?.openedAt;
  const effectivePhase: Phase =
    phase === "sealed" && alreadyOpened ? "open" : phase;

  function handleOpen() {
    if (prefersReducedMotion()) {
      markOpened.mutate({ id: letterId });
      setPhase("open");
      return;
    }
    setPhase("opening");
  }

  function handleAnimationComplete() {
    markOpened.mutate({ id: letterId });
    setPhase("open");
  }

  if (letter.isLoading) {
    return (
      <div className="py-20 text-center text-stone-400">
        Fetching your letter…
      </div>
    );
  }

  if (letter.error || !letter.data) {
    return <LetterNotFound />;
  }

  const data = letter.data;
  const theme = { paper: data.paper, ink: data.ink, font: data.font };
  const sender = data.senderName || data.senderEmail || "a correspondent";

  if (effectivePhase === "open") {
    return (
      <RevealedLetter
        letterId={letterId}
        content={(data.content as JSONContent | null) ?? null}
        theme={theme}
        sender={sender}
      />
    );
  }

  return (
    <div className="flex flex-col items-center py-16 text-center">
      <SealedEnvelope paper={data.paper} />
      <p className="mt-8 font-serif text-2xl text-stone-900">
        A letter from {sender}
      </p>
      <p className="mt-2 text-sm text-stone-500">
        Take your time. Once you open it, it&apos;s yours to keep.
      </p>
      <Button
        variant="unstyled"
        onPress={handleOpen}
        isDisabled={phase === "opening"}
        className="mt-8 inline-flex h-11 items-center justify-center rounded-full bg-stone-900 px-6 text-sm font-medium text-stone-50 transition-colors hover:bg-stone-700 disabled:opacity-60"
      >
        Open letter
      </Button>

      <AnimatePresence>
        {phase === "opening" && (
          <EnvelopeOpen theme={theme} onComplete={handleAnimationComplete} />
        )}
      </AnimatePresence>
    </div>
  );
}
