"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
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

// Excalidraw-style toolbar accent.
const ACCENT = "#6965db";
const ACCENT_SELECTED_BG = "#e0dfff";

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
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={!canSend || sending}
              className="h-[30px] rounded-lg px-4 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
              style={{ backgroundColor: ACCENT }}
            >
              {sending ? "Sealing…" : "Seal & send"}
            </button>
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

function Island({ children }: { children: React.ReactNode }) {
  return (
    <div className="pointer-events-auto flex items-center gap-0.5 rounded-xl border border-stone-200 bg-white p-1.5 shadow-[0_3px_8px_rgba(15,15,15,0.12),0_1px_2px_rgba(15,15,15,0.08)]">
      {children}
    </div>
  );
}

function StationeryToolbar({
  paper,
  ink,
  font,
  onChange,
}: {
  paper: PaperKey;
  ink: InkKey;
  font: FontKey;
  onChange: (next: { paper?: PaperKey; ink?: InkKey; font?: FontKey }) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      {/* Collapsed trigger: previews of the current paper, ink, and font. */}
      <div className="pointer-events-auto inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white p-1.5 shadow-[0_3px_8px_rgba(15,15,15,0.12),0_1px_2px_rgba(15,15,15,0.08)]">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          title="Stationery"
          className={`flex h-[30px] items-center gap-2 rounded-lg px-2 transition-colors ${
            open ? "" : "hover:bg-stone-100"
          }`}
          style={open ? { backgroundColor: ACCENT_SELECTED_BG } : undefined}
        >
          <span
            className="h-[18px] w-[18px] rounded-full border border-black/15"
            style={{ backgroundColor: paperBg(paper) }}
          />
          <span
            className="h-[18px] w-[18px] rounded-full border border-black/15"
            style={{ backgroundColor: inkColor(ink) }}
          />
          <span
            className="text-sm text-stone-600"
            style={{ fontFamily: fontFamily(font) }}
          >
            {FONTS[font].label[0]}
          </span>
          <svg
            width={12}
            height={12}
            viewBox="0 0 12 12"
            fill="none"
            className={`text-stone-400 transition-transform ${
              open ? "rotate-180" : ""
            }`}
            aria-hidden
          >
            <path
              d="M3 4.5L6 7.5L9 4.5"
              stroke="currentColor"
              strokeWidth={1.4}
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* Fold-down panel with the full controls. */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="pointer-events-auto absolute left-0 top-full mt-2 origin-top rounded-xl border border-stone-200 bg-white p-3 shadow-[0_3px_8px_rgba(15,15,15,0.12),0_1px_2px_rgba(15,15,15,0.08)]"
          >
            <ToolbarSection label="Paper">
              <SwatchGroup
                options={Object.entries(PAPERS).map(([key, v]) => ({
                  key,
                  label: v.label,
                  color: v.bg,
                }))}
                selected={paper}
                onSelect={(k) => onChange({ paper: k as PaperKey })}
              />
            </ToolbarSection>
            <ToolbarSection label="Ink">
              <SwatchGroup
                options={Object.entries(INKS).map(([key, v]) => ({
                  key,
                  label: v.label,
                  color: v.color,
                }))}
                selected={ink}
                onSelect={(k) => onChange({ ink: k as InkKey })}
              />
            </ToolbarSection>
            <ToolbarSection label="Font">
              <FontGroup selected={font} onSelect={(k) => onChange({ font: k })} />
            </ToolbarSection>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ToolbarSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-3 first:mt-0">
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-stone-400">
        {label}
      </span>
      {children}
    </div>
  );
}

function SwatchGroup({
  options,
  selected,
  onSelect,
}: {
  options: { key: string; label: string; color: string }[];
  selected: string;
  onSelect: (key: string) => void;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {options.map((o) => {
        const active = selected === o.key;
        return (
          <button
            key={o.key}
            type="button"
            title={o.label}
            onClick={() => onSelect(o.key)}
            className={`flex h-[30px] w-[30px] items-center justify-center rounded-lg transition-colors ${
              active ? "" : "hover:bg-stone-100"
            }`}
            style={active ? { backgroundColor: ACCENT_SELECTED_BG } : undefined}
          >
            <span
              className="h-[18px] w-[18px] rounded-full border border-black/15"
              style={{
                backgroundColor: o.color,
                boxShadow: active ? `0 0 0 1.5px ${ACCENT}` : undefined,
              }}
            />
          </button>
        );
      })}
    </div>
  );
}

function FontGroup({
  selected,
  onSelect,
}: {
  selected: FontKey;
  onSelect: (key: FontKey) => void;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {Object.entries(FONTS).map(([key, v]) => {
        const active = selected === key;
        return (
          <button
            key={key}
            type="button"
            title={v.label}
            onClick={() => onSelect(key as FontKey)}
            className={`h-[30px] min-w-[30px] rounded-lg px-2 text-sm transition-colors ${
              active ? "font-bold" : "text-stone-600 hover:bg-stone-100"
            }`}
            style={{
              fontFamily: v.family,
              ...(active
                ? { backgroundColor: ACCENT_SELECTED_BG, color: ACCENT }
                : undefined),
            }}
          >
            {v.label[0]}
          </button>
        );
      })}
    </div>
  );
}

function Salutation({
  friends,
  recipientId,
  ink,
  onSelect,
}: {
  friends: { id: string; name: string | null; email: string }[];
  recipientId: string | null;
  ink: string;
  onSelect: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const recipient = friends.find((f) => f.id === recipientId);
  const recipientName = recipient ? recipient.name || recipient.email : null;

  return (
    <div className="text-[1.375rem] leading-relaxed">
      Dear{" "}
      <span ref={rootRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="inline-flex cursor-pointer items-baseline gap-1.5 border-b-2 border-dashed bg-transparent px-0.5 pb-px"
          style={{ color: ink, borderColor: `${ink}66` }}
        >
          {recipientName ?? "choose a correspondent"}
          <svg
            width={12}
            height={12}
            viewBox="0 0 12 12"
            fill="none"
            className="self-center"
            aria-hidden
          >
            <path
              d="M3 4.5L6 7.5L9 4.5"
              stroke="currentColor"
              strokeWidth={1.4}
              strokeLinecap="round"
            />
          </svg>
        </button>
        {open && (
          <span
            className="absolute left-0 top-full z-20 mt-2 block min-w-52 rounded-xl border border-stone-200 bg-white p-1 font-sans text-sm shadow-lg"
            style={{ fontFamily: "var(--font-sans, system-ui, sans-serif)" }}
          >
            {friends.length === 0 ? (
              <span className="block px-3 py-2 text-xs text-stone-400">
                No correspondents yet. Invite someone from your mailbox.
              </span>
            ) : (
              friends.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    onSelect(f.id);
                    setOpen(false);
                  }}
                  className={`block w-full rounded-lg px-3 py-1.5 text-left transition-colors ${
                    f.id === recipientId
                      ? "bg-stone-100 text-stone-900"
                      : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                  }`}
                >
                  {f.name || f.email}
                </button>
              ))
            )}
          </span>
        )}
      </span>
      ,
    </div>
  );
}
