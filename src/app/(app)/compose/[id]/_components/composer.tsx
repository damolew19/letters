"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence } from "motion/react";
import type { JSONContent } from "@tiptap/react";
import { useDebouncedCallback } from "use-debounce";
import { Heading } from "react-aria-components";
import { trpc } from "@/client/lib/trpc";
import { Button } from "@/client/components/ui/button";
import { Modal } from "@/client/components/ui/modal";
import { LetterEditor } from "./letter-editor";
import { SealAnimation } from "./seal-animation";
import { StationeryToolbar } from "./stationery-toolbar";
import { Salutation } from "./salutation";
import { ACCENT } from "./accent";
import {
  paperBg,
  inkColor,
  fontFamily,
  type PaperKey,
  type InkKey,
  type FontKey,
} from "@/client/lib/theme";

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function Composer({ draftId }: { draftId: string }) {
  const router = useRouter();
  const utils = trpc.useUtils();

  const draftQuery = trpc.letters.getDraft.useQuery({ id: draftId });
  const friendsQuery = trpc.friends.list.useQuery();

  const [recipientId, setRecipientId] = useState<string | null>(null);
  const [paper, setPaper] = useState<PaperKey>("cream");
  const [ink, setInk] = useState<InkKey>("sepia");
  const [font, setFont] = useState<FontKey>("serif");
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [hasContent, setHasContent] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);

  // Sealing finishes (redirects) only once both the animation and the send
  // mutation have completed; these refs let either completion order win.
  const animDone = useRef(false);
  const sendOk = useRef(false);

  // Latest editor content, kept in a ref so saves always send the newest value.
  const contentRef = useRef<JSONContent | null>(null);
  const excerptRef = useRef<string>("");
  const initialized = useRef(false);

  const saveMutation = trpc.letters.saveDraft.useMutation({
    onMutate: () => setStatus("saving"),
    onSuccess: () => setStatus("saved"),
    onError: () => setStatus("error"),
  });

  // Seed local state once the draft loads.
  useEffect(() => {
    if (initialized.current || !draftQuery.data) return;
    const d = draftQuery.data;
    setRecipientId(d.recipientId ?? null);
    setPaper((d.paper as PaperKey) ?? "cream");
    setInk((d.ink as InkKey) ?? "sepia");
    setFont((d.font as FontKey) ?? "serif");
    contentRef.current = (d.content as JSONContent | null) ?? null;
    excerptRef.current = d.excerpt ?? "";
    setHasContent((d.excerpt ?? "").trim().length > 0);
    initialized.current = true;
  }, [draftQuery.data]);

  const runSave = (override?: { recipientId?: string | null }) => {
    saveMutation.mutate({
      id: draftId,
      content: contentRef.current ?? undefined,
      excerpt: excerptRef.current,
      recipientId:
        override && "recipientId" in override
          ? override.recipientId
          : recipientId,
      paper,
      ink,
      font,
    });
  };

  const scheduleSave = useDebouncedCallback(runSave, 1000);

  // Save any pending edit when the tab is hidden or closed.
  useEffect(() => {
    const onHide = () => scheduleSave.flush();
    window.addEventListener("beforeunload", onHide);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("beforeunload", onHide);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [scheduleSave]);

  const finish = useCallback(() => {
    if (animDone.current && sendOk.current) {
      router.push("/mailbox");
    }
  }, [router]);

  const sendMutation = trpc.letters.send.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.letters.listDrafts.invalidate(),
        utils.letters.listSent.invalidate(),
      ]);
      sendOk.current = true;
      finish();
    },
    onError: () => {
      setSending(false);
      animDone.current = false;
    },
  });

  async function handleConfirmSend() {
    setConfirmOpen(false);
    scheduleSave.cancel();
    animDone.current = false;
    sendOk.current = false;
    setSending(true);
    try {
      // Persist the latest edits before sealing so the server sees current content.
      await saveMutation.mutateAsync({
        id: draftId,
        content: contentRef.current ?? undefined,
        excerpt: excerptRef.current,
        recipientId,
        paper,
        ink,
        font,
      });
      sendMutation.mutate({ id: draftId });
    } catch {
      setSending(false);
    }
  }

  function handleEditorUpdate({
    json,
    text,
  }: {
    json: JSONContent;
    text: string;
  }) {
    contentRef.current = json;
    excerptRef.current = text.trim().slice(0, 280);
    setHasContent(text.trim().length > 0);
    setStatus("saving");
    scheduleSave();
  }

  function handleThemeChange(next: {
    paper?: PaperKey;
    ink?: InkKey;
    font?: FontKey;
  }) {
    if (next.paper) setPaper(next.paper);
    if (next.ink) setInk(next.ink);
    if (next.font) setFont(next.font);
    setStatus("saving");
    scheduleSave();
  }

  function handleRecipientChange(id: string | null) {
    setRecipientId(id);
    setStatus("saving");
    runSave({ recipientId: id });
  }

  if (draftQuery.isLoading) {
    return (
      <div className="py-20 text-center text-stone-400">Opening stationery…</div>
    );
  }
  if (draftQuery.error) {
    const sealed = draftQuery.error.data?.code === "BAD_REQUEST";
    return (
      <div className="py-20 text-center text-stone-500">
        <p>
          {sealed
            ? "This letter has been sealed and sent."
            : draftQuery.error.message}
        </p>
        <Link
          href="/mailbox"
          className="mt-3 inline-block text-sm text-stone-700 underline underline-offset-4 hover:text-stone-900"
        >
          Back to mailbox
        </Link>
      </div>
    );
  }

  const friends = friendsQuery.data ?? [];
  const initialContent = (draftQuery.data?.content as JSONContent | null) ?? null;
  const canSend = !!recipientId && hasContent;

  return (
    <div>
      {/* Floating toolbar islands pinned to the viewport, Excalidraw-style. */}
      <div className="pointer-events-none fixed inset-x-4 top-4 z-30 flex items-start justify-between gap-3">
        <StationeryToolbar
          paper={paper}
          ink={ink}
          font={font}
          onChange={handleThemeChange}
        />

        <div className="relative">
          <Island>
            <span className="px-2 text-xs text-stone-400">
              {statusLabel(status)}
            </span>
            <Button
              variant="unstyled"
              onPress={() => setConfirmOpen(true)}
              isDisabled={!canSend || sending}
              className="h-[30px] rounded-lg px-4 text-sm font-semibold text-white outline-none transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
              style={{ backgroundColor: ACCENT }}
            >
              {sending ? "Sealing…" : "Seal & send"}
            </Button>
          </Island>
          {sendMutation.error && !sending && (
            <p className="absolute right-0 top-full mt-2 whitespace-nowrap text-xs text-red-600">
              {sendMutation.error.message}
            </p>
          )}
        </div>
      </div>

      {/* Stationery sheet */}
      <div
        className="rounded-2xl border border-stone-200 shadow-sm"
        style={{
          backgroundColor: paperBg(paper),
          color: inkColor(ink),
          fontFamily: fontFamily(font),
        }}
      >
        <div className="px-8 pt-8">
          <Salutation
            friends={friends}
            recipientId={recipientId}
            ink={inkColor(ink)}
            onSelect={handleRecipientChange}
          />
        </div>
        <div className="px-8 pb-6 pt-2">
          <LetterEditor
            initialContent={initialContent}
            onUpdate={handleEditorUpdate}
          />
        </div>
      </div>

      <Modal
        variant="center"
        role="alertdialog"
        isOpen={confirmOpen}
        onOpenChange={setConfirmOpen}
      >
        <Heading slot="title" className="font-serif text-xl text-stone-900">
          Seal this letter?
        </Heading>
        <p className="mt-2 text-sm text-stone-500">
          Once sealed, you can&apos;t edit or read this letter again. It will be
          on its way to your correspondent.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="ghost" onPress={() => setConfirmOpen(false)}>
            Cancel
          </Button>
          <Button onPress={handleConfirmSend}>Seal &amp; send</Button>
        </div>
      </Modal>

      <AnimatePresence>
        {sending && (
          <SealAnimation
            theme={{ paper, ink, font }}
            onComplete={() => {
              animDone.current = true;
              finish();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function statusLabel(status: SaveStatus) {
  switch (status) {
    case "saving":
      return "Saving…";
    case "saved":
      return "Draft saved";
    case "error":
      return "Couldn't save";
    default:
      return "Draft";
  }
}

function Island({ children }: { children: React.ReactNode }) {
  return (
    <div className="pointer-events-auto flex items-center gap-0.5 rounded-xl border border-stone-200 bg-white p-1.5 shadow-[0_3px_8px_rgba(15,15,15,0.12),0_1px_2px_rgba(15,15,15,0.08)]">
      {children}
    </div>
  );
}
