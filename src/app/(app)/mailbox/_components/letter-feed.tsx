"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { trpc } from "@/client/lib/trpc";
import { InviteButton } from "./invite-button";

function formatDate(value: string | Date | null | undefined) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function time(value: string | Date | null | undefined) {
  return value ? new Date(value).getTime() : 0;
}

function initials(source: string) {
  const cleaned = source.replace(/^(From|To)\s+/i, "").trim();
  const parts = cleaned.split(/\s+/);
  return (((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "·");
}

// Dusty, muted pastels — assigned deterministically per correspondent so a
// person keeps the same tint across the mailbox.
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

type Person = {
  id: string;
  name: string | null;
  email: string;
  unreadCount: number;
  latestArrivedAt: string | Date | null;
  latestUnreadLetterId: string | null;
  lastActivityAt: string | Date | null;
  lastDir: "in" | "out" | null;
  lastOutOpened: boolean;
  draft: { id: string; excerpt: string | null; updatedAt: string | Date } | null;
};

function displayName(p: { name: string | null; email: string }) {
  return p.name || p.email || "A correspondent";
}

// The state of the correspondence, shown as the person's subtitle.
function status(p: Person): string {
  if (p.draft) return "You're writing back";
  if (p.lastDir === "out") {
    return p.lastOutOpened ? "They opened your letter" : "Your letter is on its way";
  }
  if (p.lastDir === "in") return "You read their letter";
  return "No letters yet";
}

export function LetterFeed() {
  const overview = trpc.friends.overview.useQuery();
  const drafts = trpc.letters.listDrafts.useQuery();

  const people = (overview.data ?? []) as Person[];
  const waiting = people
    .filter((p) => p.unreadCount > 0)
    .sort((a, b) => time(b.latestArrivedAt) - time(a.latestArrivedAt));
  const correspondents = people
    .filter((p) => p.unreadCount === 0)
    .sort((a, b) => time(b.lastActivityAt) - time(a.lastActivityAt));

  // Drafts with no recipient belong to no relationship, so they sit on their own.
  const unaddressed = (drafts.data ?? []).filter((d) => !d.recipientId);

  return (
    <div>
      <div className="pt-9">
        {overview.isLoading ? (
          <CardSkeletons />
        ) : (
          <div className="flex flex-col gap-12">
            {/* Waiting for you — unread sealed letters, one card per sender */}
            <section className="relative">
              {waiting.length > 0 && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute -inset-x-8 -top-12 bottom-0 -z-10 overflow-hidden"
                >
                  <div className="absolute left-0 top-0 h-44 w-44 rounded-full bg-[#f0c9b8] opacity-50 blur-3xl" />
                  <div className="absolute right-2 top-6 h-52 w-52 rounded-full bg-[#cbd9c0] opacity-45 blur-3xl" />
                  <div className="absolute left-32 bottom-0 h-44 w-44 rounded-full bg-[#d9cbe6] opacity-40 blur-3xl" />
                </div>
              )}

              <h2 className="mb-4 font-serif text-2xl tracking-tight text-[#2b2621]">
                Waiting for you
              </h2>

              {waiting.length === 0 ? (
                <EmptyNote>Nothing new — your mailbox is quiet.</EmptyNote>
              ) : (
                <div className="flex flex-col gap-3">
                  {waiting.map((p) => {
                    const who = displayName(p);
                    return (
                      <Link
                        key={p.id}
                        href={
                          p.latestUnreadLetterId
                            ? `/letter/${p.latestUnreadLetterId}`
                            : `/people/${p.id}`
                        }
                        className="group flex items-center gap-4 rounded-2xl border border-[#e7e0d6]/80 bg-white/70 p-4 backdrop-blur-sm transition-colors hover:border-[#d8ccba] hover:bg-white/90"
                      >
                        <Avatar seed={who} tint={tintFor(p.email || who)} large />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-serif text-[17px] text-[#2b2621]">
                            {who}
                          </span>
                          <span className="block text-sm italic text-[#8a8178]">
                            Sealed · arrived {formatDate(p.latestArrivedAt)}
                            {p.unreadCount > 1 ? ` · ${p.unreadCount} waiting` : ""}
                            {p.draft ? " · you're mid-reply" : ""}
                          </span>
                        </span>
                        <span className="text-sm text-[#bc6c47] transition-colors group-hover:text-[#a1542f]">
                          Open
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Your correspondents — the relationships, not folders */}
            {correspondents.length > 0 && (
              <section>
                <SectionLabel>Your correspondents</SectionLabel>
                <List>
                  {correspondents.map((p) => {
                    const who = displayName(p);
                    return (
                      <RowLink key={p.id} href={`/people/${p.id}`}>
                        <Avatar seed={who} tint={tintFor(p.email || who)} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm text-[#2b2621]">
                            {who}
                          </span>
                          <span className="block truncate text-xs italic text-[#a89f95]">
                            {status(p)}
                          </span>
                        </span>
                        {p.draft && <StatePill>Draft</StatePill>}
                        {!p.draft && p.lastDir === "out" && !p.lastOutOpened && (
                          <StatePill>On its way</StatePill>
                        )}
                        <RowDate>
                          {formatDate(p.draft?.updatedAt ?? p.lastActivityAt)}
                        </RowDate>
                      </RowLink>
                    );
                  })}
                </List>
              </section>
            )}

            {/* Orphan drafts — not addressed to anyone yet */}
            {unaddressed.length > 0 && (
              <section>
                <SectionLabel>Not addressed yet</SectionLabel>
                <List>
                  {unaddressed.map((d) => (
                    <RowLink key={d.id} href={`/compose/${d.id}`}>
                      <span
                        className="h-9 w-9 shrink-0 rounded-full border border-dashed border-[#d3c9b8]"
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1 truncate text-sm italic text-[#6f665c]">
                        {d.excerpt?.trim() || "Empty letter"}
                      </span>
                      <RowDate>{formatDate(d.updatedAt)}</RowDate>
                    </RowLink>
                  ))}
                </List>
              </section>
            )}

            {people.length === 0 && unaddressed.length === 0 && (
              <EmptyNote>
                No correspondents yet — invite someone below to start writing.
              </EmptyNote>
            )}

            {/* Grow the circle: invite a friend to become a correspondent */}
            <InviteButton />
          </div>
        )}
      </div>
    </div>
  );
}

function Avatar({
  seed,
  tint,
  large,
}: {
  seed: string;
  tint: { bg: string; fg: string };
  large?: boolean;
}) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-medium ${
        large ? "h-11 w-11 text-sm" : "h-9 w-9 text-xs"
      }`}
      style={{ background: tint.bg, color: tint.fg }}
      aria-hidden
    >
      {initials(seed)}
    </span>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-2 border-b border-[#e7e0d6] pb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-[#a89f95]">
      {children}
    </h3>
  );
}

function List({ children }: { children: ReactNode }) {
  return <div className="divide-y divide-[#efe9df]">{children}</div>;
}

function RowLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="flex w-full items-center gap-3 py-3 text-left transition-colors hover:bg-[#f4efe6]/60"
    >
      {children}
    </Link>
  );
}

function StatePill({ children }: { children: ReactNode }) {
  return (
    <span className="shrink-0 rounded-full border border-[#e7d9c9] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#a1732f]">
      {children}
    </span>
  );
}

function RowDate({ children }: { children: ReactNode }) {
  return (
    <span className="w-11 shrink-0 text-right text-xs tabular-nums text-[#c1b8ac]">
      {children}
    </span>
  );
}

function EmptyNote({ children }: { children: ReactNode }) {
  return <p className="py-2 text-sm italic text-[#a89f95]">{children}</p>;
}

function CardSkeletons() {
  return (
    <div className="flex flex-col gap-3">
      {[0, 1].map((i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-2xl border border-[#e7e0d6]/80 bg-white/50 p-4"
        >
          <span className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-[#ece5da]" />
          <span className="flex-1">
            <span className="mb-2 block h-4 w-40 animate-pulse rounded bg-[#ece5da]" />
            <span className="block h-3 w-28 animate-pulse rounded bg-[#f0ebe1]" />
          </span>
        </div>
      ))}
    </div>
  );
}
