"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/client/components/ui/button";
import { Tab, TabList, TabPanel, Tabs } from "@/client/components/ui/tabs";
import { trpc } from "@/client/lib/trpc";

function formatDate(value: string | Date | null | undefined) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatMonthYear(value: string | Date | null | undefined) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

// A turnaround in days → a human phrase for the ledger.
function formatDays(n: number | null | undefined) {
  if (n == null) return "—";
  if (n < 0.5) return "same day";
  const r = Math.round(n);
  return `${r} day${r === 1 ? "" : "s"}`;
}

// Days since the last letter → "today" / "yesterday" / "N days ago".
function formatSince(days: number | null | undefined) {
  if (days == null) return "—";
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

// How long you took to open a letter → hours, rolling up to days.
function formatOpenSpeed(hours: number | null | undefined) {
  if (hours == null) return "—";
  if (hours < 1) return "within the hour";
  if (hours < 36) {
    const r = Math.round(hours);
    return `${r} hour${r === 1 ? "" : "s"}`;
  }
  const d = Math.round(hours / 24);
  return `${d} day${d === 1 ? "" : "s"}`;
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

// Their ink — used to mark incoming/unread letters in the record.
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
  const [tab, setTab] = useState<"letters" | "stats">("letters");

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

  const {
    person,
    totals,
    readingMinutes,
    draft,
    history,
    unread,
    unreadWords,
    firstUnreadId,
    rhythm,
    longestLetter,
  } = data;
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

  // "The story so far" — a written summary of the correspondence.
  const moreWriter =
    totals.sent > totals.received ? "you" : totals.sent < totals.received ? firstName : null;
  const writerClause = moreWriter
    ? `${moreWriter === "you" ? "You" : moreWriter} write${moreWriter === "you" ? "" : "s"} a little more often.`
    : "You two write about evenly.";
  const replyStr =
    rhythm.yourReplyDays == null
      ? null
      : rhythm.yourReplyDays < 0.5
        ? "a day"
        : formatDays(rhythm.yourReplyDays);

  const ledger: [string, string][] = [
    ["First letter", `${formatMonthYear(data.since)} · from ${firstName}`],
    ["Last letter", formatSince(rhythm.daysSinceLast)],
    ["You reply in", formatDays(rhythm.yourReplyDays)],
    [`${firstName} replies in`, formatDays(rhythm.theirReplyDays)],
    ["Fastest reply", formatDays(rhythm.fastestReplyDays)],
    [
      "Longest silence",
      rhythm.longestSilenceDays != null ? `${rhythm.longestSilenceDays} days` : "—",
    ],
    ["You open their letters", formatOpenSpeed(rhythm.openLatencyHours)],
    ...(longestLetter
      ? ([
          [
            "Longest letter",
            `${longestLetter.words.toLocaleString()} words · ${longestLetter.dir === "out" ? "you" : firstName}`,
          ],
        ] as [string, string][])
      : []),
    ["Words read", `${data.wordsRead.toLocaleString()} · ~${readingMinutes} min`],
  ];

  return (
    <div>
      <Link
        href="/mailbox"
        className="text-sm text-[#8a8178] transition-colors hover:text-[#2b2621]"
      >
        ← Mailbox
      </Link>

      {/* Header: the relationship, front and center */}
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-4">
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
              {!draft && (
                <span className="rounded-full border border-[#e7e0d6] px-2 py-0.5 text-[11px] uppercase tracking-wider text-[#8a8178]">
                  {TURN_LABEL[turn]}
                </span>
              )}
            </div>
          </div>
        </div>
        {!draft && (
          <Button
            variant="accent"
            onPress={writeTo}
            isDisabled={busy}
            className="w-full shrink-0 sm:w-auto sm:max-w-[16rem]"
          >
            <span className="truncate">
              {busy ? "Opening…" : `Write to ${firstName}`}
            </span>
          </Button>
        )}
      </div>

      <hr className="mt-6 border-[#e7e0d6]" />

      {/* Attention band — what's waiting on you, above everything else. */}
      {(unread > 0 || draft) && (
        <div className="mt-8 flex flex-col gap-3">
          {/* #1 Unread — the loudest thing on the page. */}
          {unread > 0 && firstUnreadId && (
            <Link
              href={`/letter/${firstUnreadId}`}
              className="flex items-center gap-4 rounded-2xl bg-[#bc6c47] p-4 text-[#faf7f2] transition-colors hover:bg-[#a1542f]"
            >
              <span className="min-w-0 flex-1">
                <span className="block font-medium">
                  {unread} unread {unread === 1 ? "letter" : "letters"} from {firstName}
                </span>
                {unreadWords > 0 && (
                  <span className="block text-sm text-[#faf7f2]/80">
                    about {Math.max(1, Math.round(unreadWords / 200))} min of reading, still sealed
                  </span>
                )}
              </span>
              <span className="shrink-0 rounded-full bg-[#faf7f2] px-4 py-1.5 text-sm font-medium text-[#2b2621]">
                Read now
              </span>
            </Link>
          )}

          {/* #2 Draft — the letter you started but haven't sent. */}
          {draft && (
            <Link
              href={`/compose/${draft.id}`}
              className="flex items-center gap-4 rounded-2xl border border-[#e7e0d6] bg-white/60 p-4 transition-colors hover:border-[#d8ccba] hover:bg-white/90"
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
        </div>
      )}

      {hasLetters ? (
        <Tabs
          selectedKey={tab}
          onSelectionChange={(key) => setTab(key as "letters" | "stats")}
          className="mt-8"
        >
          {/* Tabs — the record vs. the numbers. */}
          <TabList
            aria-label="Correspondence"
            className="flex gap-6 border-b border-[#e7e0d6]"
          >
            <Tab id="letters" badge={unread}>
              Letters
            </Tab>
            <Tab id="stats">Stats</Tab>
          </TabList>

          <TabPanel id="letters" className="mt-6">
            <section>
              <div className="divide-y divide-[#efe9df]">
                {history.map((l) => {
                  const incoming = l.dir === "in";
                  const isUnread = incoming && !l.openedAt;
                  const label = incoming ? `${firstName} wrote` : "You wrote";
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
                          isUnread
                            ? { background: INK_THEM }
                            : incoming
                              ? { background: "#d8c7bd" }
                              : { background: "transparent", border: "1px solid #c1b8ac" }
                        }
                        aria-hidden
                      />
                      <span
                        className={`min-w-0 flex-1 truncate text-sm ${
                          isUnread
                            ? "font-medium text-[#2b2621]"
                            : incoming
                              ? "text-[#2b2621]"
                              : "text-[#6f665c]"
                        }`}
                      >
                        {label}
                      </span>
                      {isUnread && (
                        <span className="shrink-0 rounded-full bg-[#f2e2d5] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[#a1542f]">
                          Unread
                        </span>
                      )}
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
          </TabPanel>

          <TabPanel id="stats" className="mt-8 flex flex-col gap-8">
              {/* The story so far — a written summary */}
              <p className="font-serif text-lg leading-relaxed text-[#3a332c]">
                Since {formatMonthYear(data.since)}, you and {firstName} have traded{" "}
                <span className="text-[#bc6c47]">{totals.total} letters</span>. {writerClause}
                {replyStr ? ` You usually reply within ${replyStr}.` : ""} It&apos;s been{" "}
                <span className="text-[#bc6c47]">{formatSince(rhythm.daysSinceLast)}</span> since{" "}
                {firstName}&apos;s last.
              </p>

              {/* The ledger — quiet label/value pairs */}
              <dl className="divide-y divide-[#efe9df] border-t border-[#efe9df]">
                {ledger.map(([label, value]) => (
                  <div key={label} className="flex items-baseline justify-between gap-4 py-3">
                    <dt className="text-sm text-[#a89f95]">{label}</dt>
                    <dd className="text-right text-sm text-[#2b2621]">{value}</dd>
                  </div>
                ))}
              </dl>
          </TabPanel>
        </Tabs>
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

