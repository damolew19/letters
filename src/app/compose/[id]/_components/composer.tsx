"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence } from "motion/react";
import type { JSONContent } from "@tiptap/react";
import { useDebouncedCallback } from "use-debounce";
import { trpc } from "@/client/lib/trpc";
import { Button } from "@/client/components/ui/button";
import { LetterEditor } from "./letter-editor";
import { SealAnimation } from "./seal-animation";
import {
  PAPERS,
  INKS,
  FONTS,
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

  function handleRecipientChange(value: string) {
    const next = value || null;
    setRecipientId(next);
    setStatus("saving");
    runSave({ recipientId: next });
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
    <div className="grid gap-6 lg:grid-cols-[1fr_16rem]">
      {/* Stationery sheet */}
      <div
        className="order-2 rounded-2xl border border-stone-200 shadow-sm lg:order-1"
        style={{
          backgroundColor: paperBg(paper),
          color: inkColor(ink),
          fontFamily: fontFamily(font),
        }}
      >
        <div className="px-8 py-6">
          <LetterEditor
            initialContent={initialContent}
            onUpdate={handleEditorUpdate}
          />
        </div>
      </div>

      {/* Side panel */}
      <aside className="order-1 flex flex-col gap-5 lg:order-2">
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <label className="block text-xs font-medium uppercase tracking-wide text-stone-500">
            To
          </label>
          <select
            value={recipientId ?? ""}
            onChange={(e) => handleRecipientChange(e.target.value)}
            className="mt-2 h-10 w-full rounded-lg border border-stone-300 bg-white px-2 text-sm text-stone-900 outline-none focus:border-stone-900"
          >
            <option value="">Choose a correspondent…</option>
            {friends.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name || f.email}
              </option>
            ))}
          </select>
          {friends.length === 0 && (
            <p className="mt-2 text-xs text-stone-400">
              No correspondents yet. Invite someone from your mailbox.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <Swatches
            label="Paper"
            options={Object.entries(PAPERS).map(([key, v]) => ({
              key,
              label: v.label,
              color: v.bg,
            }))}
            selected={paper}
            onSelect={(k) => handleThemeChange({ paper: k as PaperKey })}
          />
          <Swatches
            label="Ink"
            options={Object.entries(INKS).map(([key, v]) => ({
              key,
              label: v.label,
              color: v.color,
            }))}
            selected={ink}
            onSelect={(k) => handleThemeChange({ ink: k as InkKey })}
          />
          <div className="mt-4">
            <span className="block text-xs font-medium uppercase tracking-wide text-stone-500">
              Font
            </span>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {Object.entries(FONTS).map(([key, v]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleThemeChange({ font: key as FontKey })}
                  style={{ fontFamily: v.family }}
                  className={`h-9 rounded-lg border px-2 text-sm transition-colors ${
                    font === key
                      ? "border-stone-900 bg-stone-900 text-stone-50"
                      : "border-stone-300 text-stone-700 hover:border-stone-500"
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-stone-400">
            <span>{statusLabel(status)}</span>
          </div>
          <Button
            onClick={() => setConfirmOpen(true)}
            disabled={!canSend || sending}
            className="mt-3 h-11 w-full"
          >
            {sending ? "Sealing…" : "Seal & send"}
          </Button>
          {sendMutation.error && !sending && (
            <p className="mt-2 text-xs text-red-600">
              {sendMutation.error.message}
            </p>
          )}
        </div>
      </aside>

      {confirmOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-stone-900/40 p-6">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="font-serif text-xl text-stone-900">Seal this letter?</h2>
            <p className="mt-2 text-sm text-stone-500">
              Once sealed, you can&apos;t edit or read this letter again. It will
              be on its way to your correspondent.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmSend}>Seal &amp; send</Button>
            </div>
          </div>
        </div>
      )}

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

function Swatches({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: { key: string; label: string; color: string }[];
  selected: string;
  onSelect: (key: string) => void;
}) {
  return (
    <div className="mt-1 first:mt-0">
      <span className="block text-xs font-medium uppercase tracking-wide text-stone-500">
        {label}
      </span>
      <div className="mt-2 flex gap-2">
        {options.map((o) => (
          <button
            key={o.key}
            type="button"
            title={o.label}
            onClick={() => onSelect(o.key)}
            style={{ backgroundColor: o.color }}
            className={`h-7 w-7 rounded-full border-2 transition-transform ${
              selected === o.key
                ? "border-stone-900 scale-110"
                : "border-stone-200 hover:scale-105"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
