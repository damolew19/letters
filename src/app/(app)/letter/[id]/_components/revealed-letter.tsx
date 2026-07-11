"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useEditor, EditorContent, type Editor, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { trpc } from "@/client/lib/trpc";
import { prefersReducedMotion } from "@/client/lib/motion";
import { paperBg, inkColor, fontFamily, type LetterTheme } from "@/client/lib/theme";

const REVEAL_PROSE =
  "letter-prose min-h-[16rem] outline-none [&_p]:my-2 [&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:text-2xl [&_blockquote]:border-l-2 [&_blockquote]:border-current [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:opacity-80 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6";

type RevealedLetterProps = {
  letterId: string;
  content: JSONContent | null;
  theme: LetterTheme;
  sender: string;
};

export function RevealedLetter({
  letterId,
  content,
  theme,
  sender,
}: RevealedLetterProps) {
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

  useRevealOnScroll(editor);

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

// Reveal each top-level block as it scrolls into view. Reduced-motion readers
// get every block revealed immediately.
function useRevealOnScroll(editor: Editor | null) {
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
}
