"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpc } from "@/client/lib/trpc";

function formatDate(value: string | Date | null | undefined) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function initials(source: string) {
  const cleaned = source.replace(/^(From|To)\s+/i, "").trim();
  const parts = cleaned.split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "·";
}

const TINTS = [
  { bg: "#e8d5cf", fg: "#8f5a49" },
  { bg: "#d7e0c8", fg: "#5f6b47" },
  { bg: "#ecdcb5", fg: "#8a6c34" },
  { bg: "#d5d9ec", fg: "#4f567e" },
  { bg: "#e6cfe0", fg: "#7d4f74" },
];

function tintFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return TINTS[Math.abs(hash) % TINTS.length]!;
}

// Author colors, reused by the timeline and the balance meter.
const INK_YOU = "#8a8178";
const INK_THEM = "#bc6c47";

const TURN_LABEL = {
  draft: "You're mid-reply",
  yours: "Your turn to write",
  theirs: "Awaiting their reply",
  new: "Say hello",
} as const;

export function Connection({ id }: { id: string }) {
  const router = useRouter();
  const { data, isPending, error } = trpc.friends.connection.useQuery({ id });
  const createDraft = trpc.letters.createDraft.useMutation();
  const saveDraft = trpc.letters.saveDraft.useMutation();

  if (isPending) {
    return <p className="pt-8 text-sm italic text-[#a89f95]">Gathering your letters…</p>;
  }
  if (error || !data) {
    return (
      <p className="pt-8 text-sm italic text-[#a89f95]">
        This correspondent couldn&apos;t be found.
      </p>
    );
  }

  const { person, totals, months, readingMinutes, timeline, draft, history } = data;
  const who = person.name || person.email || "A correspondent";
  const firstName = (person.name || person.email || "them").split(" ")[0];
  const tint = tintFor(person.email || who);
  const hasLetters = totals.total > 0;

  const latest = history[0];
  const turn: keyof typeof TURN_LABEL = draft
    ? "draft"
    : !latest
      ? "new"
      : latest.dir === "in"
        ? "yours"
        : "theirs";

  const busy = createDraft.isPending || saveDraft.isPending;
  async function writeTo() {
    const { id: draftId } = await createDraft.mutateAsync();
    await saveDraft.mutateAsync({ id: draftId, recipientId: person.id });
    router.push(`/compose/${draftId}`);
  }

  const maxMonth = Math.max(1, ...timeline.map((m) => m.you + m.them));
  const total = totals.total || 1;

  return (
    <div>
      <Link
        href="/mailbox"
        className="text-sm text-[#8a8178] transition-colors hover:text-[#2b2621]"
      >
        ← Mailbox
      </Link>

      {/* Header: the relationship, front and center */}
      <div className="mt-4 flex items-center gap-4">
        <span
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-medium"
          style={{ background: tint.bg, color: tint.fg }}
          aria-hidden
        >
          {initials(who)}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-serif text-3xl tracking-tight text-[#2b2621]">
            {who}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="text-sm italic text-[#8a8178]">
              {hasLetters
                ? `Corresponding since ${formatDate(data.since)} · ${totals.total} letters`
                : "No letters yet"}
            </span>
            <span className="rounded-full border border-[#e7e0d6] px-2 py-0.5 text-[11px] uppercase tracking-wider text-[#8a8178]">
              {TURN_LABEL[turn]}
            </span>
          </div>
        </div>
        {draft ? (
          <Link
            href={`/compose/${draft.id}`}
            className="shrink-0 rounded-full bg-[#bc6c47] px-4 py-2 text-sm font-medium text-[#faf7f2] transition-colors hover:bg-[#a1542f]"
          >
            Continue your letter
          </Link>
        ) : (
          <button
            type="button"
            onClick={writeTo}
            disabled={busy}
            className="shrink-0 rounded-full bg-[#bc6c47] px-4 py-2 text-sm font-medium text-[#faf7f2] transition-colors hover:bg-[#a1542f] disabled:opacity-60"
          >
            {busy ? "Opening…" : `Write to ${firstName}`}
          </button>
        )}
      </div>

      <hr className="mt-6 border-[#e7e0d6]" />

      {/* Unfinished letter — the draft to this person lives on their page */}
      {draft && (
        <Link
          href={`/compose/${draft.id}`}
          className="mt-8 flex items-center gap-4 rounded-2xl border border-[#e7e0d6] bg-white/60 p-4 transition-colors hover:border-[#d8ccba] hover:bg-white/90"
        >
          <span
            className="h-9 w-9 shrink-0 rounded-full border border-dashed border-[#d3c9b8]"
            aria-hidden
          />
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] uppercase tracking-wider text-[#a89f95]">
              Unfinished letter
            </span>
            <span className="block truncate text-sm italic text-[#6f665c]">
              {draft.excerpt?.trim() || "Empty letter"}
            </span>
          </span>
          <span className="shrink-0 text-xs text-[#a89f95]">
            {formatDate(draft.updatedAt)}
          </span>
        </Link>
      )}

      {hasLetters ? (
        <div className="mt-10 flex flex-col gap-12">
          {/* Timeline — the heartbeat of the exchange */}
          <section>
            <h2 className="mb-4 text-[11px] font-medium uppercase tracking-[0.12em] text-[#a89f95]">
              Letters per month
            </h2>
            <div className="flex h-28 items-end gap-2">
              {timeline.map((m, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                  <div className="flex h-full w-full flex-col justify-end">
                    {m.them > 0 && (
                      <div
                        className="w-full rounded-t-sm"
                        style={{ height: `${(m.them / maxMonth) * 100}%`, background: INK_THEM }}
                      />
                    )}
                    {m.you > 0 && (
                      <div
                        className="w-full"
                        style={{ height: `${(m.you / maxMonth) * 100}%`, background: INK_YOU }}
                      />
                    )}
                  </div>
                  <span className="text-[10px] text-[#a89f95]">{m.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-[#8a8178]">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: INK_THEM }} />
                {firstName}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: INK_YOU }} />
                You
              </span>
            </div>
          </section>

          {/* The headline tally */}
          <section className="grid grid-cols-3 gap-4">
            <Stat value={totals.total} label="Letters exchanged" />
            <Stat value={`${readingMinutes} min`} label="Time spent reading" />
            <Stat value={`${months} mo`} label="Corresponding" />
          </section>

          {/* Balance — who's carried the conversation */}
          <section>
            <div className="mb-2 flex items-center justify-between text-sm text-[#6f665c]">
              <span>You wrote {totals.sent}</span>
              <span>
                {firstName} wrote {totals.received}
              </span>
            </div>
            <div className="flex h-2 overflow-hidden rounded-full bg-[#efe9df]">
              <div style={{ width: `${(totals.sent / total) * 100}%`, background: INK_YOU }} />
              <div style={{ width: `${(totals.received / total) * 100}%`, background: INK_THEM }} />
            </div>
            {readingMinutes > 0 && (
              <p className="mt-2 text-xs text-[#a89f95]">
                {data.wordsRead.toLocaleString()} words read — about{" "}
                {Math.max(1, Math.round(data.wordsRead / 250))} pages.
              </p>
            )}
          </section>

          {/* The full record */}
          <section>
            <h2 className="mb-2 border-b border-[#e7e0d6] pb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-[#a89f95]">
              Every letter
            </h2>
            <div className="divide-y divide-[#efe9df]">
              {history.map((l) => {
                const incoming = l.dir === "in";
                const label = incoming
                  ? l.openedAt
                    ? `${firstName} wrote`
                    : "Sealed letter"
                  : "You wrote";
                const trailing =
                  incoming && l.words && l.words > 0
                    ? `${l.words.toLocaleString()} words`
                    : incoming
                      ? "Sealed"
                      : "Sent";
                const row = (
                  <div className="flex items-center gap-3 py-3">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={
                        incoming
                          ? { background: INK_THEM }
                          : { background: "transparent", border: "1px solid #c1b8ac" }
                      }
                      aria-hidden
                    />
                    <span
                      className={`min-w-0 flex-1 truncate text-sm ${
                        incoming ? "text-[#2b2621]" : "text-[#6f665c]"
                      }`}
                    >
                      {label}
                    </span>
                    <span className="shrink-0 text-xs text-[#a89f95]">{trailing}</span>
                    <span className="w-11 shrink-0 text-right text-xs tabular-nums text-[#c1b8ac]">
                      {formatDate(l.sealedAt)}
                    </span>
                  </div>
                );
                return incoming ? (
                  <Link key={l.id} href={`/letter/${l.id}`} className="block transition-colors hover:bg-[#f4efe6]/60">
                    {row}
                  </Link>
                ) : (
                  <div key={l.id}>{row}</div>
                );
              })}
            </div>
          </section>
        </div>
      ) : (
        !draft && (
          <p className="mt-8 text-sm italic text-[#a89f95]">
            You haven&apos;t exchanged any letters with {firstName} yet.
          </p>
        )
      )}
    </div>
  );
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div>
      <div className="font-serif text-2xl text-[#2b2621]">{value}</div>
      <div className="mt-0.5 text-xs text-[#a89f95]">{label}</div>
    </div>
  );
}
