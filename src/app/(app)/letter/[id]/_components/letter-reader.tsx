"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence } from "motion/react";
import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { trpc } from "@/client/lib/trpc";
import { EnvelopeOpen } from "./envelope-open";
import { paperBg, inkColor, fontFamily } from "@/client/lib/theme";

type Phase = "sealed" | "opening" | "open";

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

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
    return (
      <div className="py-20 text-center text-stone-500">
        <p>This letter isn&apos;t here, or isn&apos;t addressed to you.</p>
        <Link
          href="/mailbox"
          className="mt-3 inline-block text-sm text-stone-700 underline underline-offset-4 hover:text-stone-900"
        >
          Back to mailbox
        </Link>
      </div>
    );
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
      <button
        onClick={handleOpen}
        disabled={phase === "opening"}
        className="mt-8 inline-flex h-11 items-center justify-center rounded-full bg-stone-900 px-6 text-sm font-medium text-stone-50 transition-colors hover:bg-stone-700 disabled:opacity-60"
      >
        Open letter
      </button>

      <AnimatePresence>
        {phase === "opening" && (
          <EnvelopeOpen theme={theme} onComplete={handleAnimationComplete} />
        )}
      </AnimatePresence>
    </div>
  );
}

// Static sealed envelope shown before opening.
function SealedEnvelope({ paper }: { paper: string }) {
  const bg = paperBg(paper);
  return (
    <div className="relative h-44 w-64">
      <div
        className="absolute inset-x-0 bottom-0 h-32 rounded-md shadow-xl"
        style={{ background: `linear-gradient(160deg, ${bg}, rgba(0,0,0,0.06))` }}
      />
      <div
        className="absolute inset-x-0 top-0 h-24 origin-top"
        style={{
          clipPath: "polygon(0 0, 100% 0, 50% 100%)",
          background: `linear-gradient(160deg, ${bg}, rgba(0,0,0,0.1))`,
        }}
      />
      <div
        className="absolute left-1/2 top-12 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-stone-50 shadow-lg"
        style={{
          background: "radial-gradient(circle at 35% 30%, #c0392b, #7c2018 70%)",
        }}
      >
        <span className="font-serif text-lg italic">L</span>
      </div>
    </div>
  );
}

const REVEAL_PROSE =
  "letter-prose min-h-[16rem] outline-none [&_p]:my-3 [&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:text-2xl [&_blockquote]:border-l-2 [&_blockquote]:border-current [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:opacity-80 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6";

function RevealedLetter({
  letterId,
  content,
  theme,
  sender,
}: {
  letterId: string;
  content: JSONContent | null;
  theme: { paper: string; ink: string; font: string };
  sender: string;
}) {
  const nextUnread = trpc.letters.nextUnread.useQuery({ id: letterId });
  const nextId = nextUnread.data?.id ?? null;
  const senderFirst = sender.split(/\s+/)[0] || sender;
  const editor = useEditor({
    immediatelyRender: false,
    editable: false,
    extensions: [StarterKit],
    content: content ?? undefined,
    editorProps: { attributes: { class: REVEAL_PROSE } },
  });

  // Reveal each top-level block as it scrolls into view. Reduced-motion users
  // get every block revealed immediately.
  useEffect(() => {
    if (!editor) return;
    const root = editor.view.dom as HTMLElement;
    const blocks = Array.from(root.children) as HTMLElement[];

    if (prefersReducedMotion()) {
      blocks.forEach((b) => b.classList.add("reveal-block", "revealed"));
      return;
    }

    blocks.forEach((b) => b.classList.add("reveal-block"));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
    );
    blocks.forEach((b) => observer.observe(b));
    return () => observer.disconnect();
  }, [editor]);

  return (
    <div>
      <p className="mb-6 text-center text-sm uppercase tracking-widest text-stone-400">
        From {sender}
      </p>
      <article
        className="rounded-2xl border border-stone-200 px-8 py-10 shadow-sm"
        style={{
          backgroundColor: paperBg(theme.paper),
          color: inkColor(theme.ink),
          fontFamily: fontFamily(theme.font),
        }}
      >
        <EditorContent editor={editor} />
      </article>
      <div className="mt-8 flex flex-col items-center gap-4 text-center">
        {nextId && (
          <Link
            href={`/letter/${nextId}`}
            className="inline-flex h-11 items-center justify-center rounded-full bg-stone-900 px-6 text-sm font-medium text-stone-50 transition-colors hover:bg-stone-700"
          >
            Next unread from {senderFirst} →
          </Link>
        )}
        <Link
          href="/mailbox"
          className="text-sm text-stone-500 underline underline-offset-4 hover:text-stone-900"
        >
          Back to mailbox
        </Link>
      </div>
    </div>
  );
}
