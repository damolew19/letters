import Link from "next/link";
import type { Person } from "./feed-types";
import { displayName, formatDate, tintFor } from "./feed-utils";
import { Avatar, EmptyNote } from "./feed-primitives";

// Unread sealed letters, one card per sender.
export function WaitingSection({ people }: { people: Person[] }) {
  return (
    <section className="relative">
      {people.length > 0 && <WaitingGlow />}

      <h2 className="mb-4 font-serif text-2xl tracking-tight text-[#2b2621]">
        Waiting for you
      </h2>

      {people.length === 0 ? (
        <EmptyNote>Nothing new — your mailbox is quiet.</EmptyNote>
      ) : (
        <div className="flex flex-col gap-3">
          {people.map((p) => (
            <WaitingCard key={p.id} person={p} />
          ))}
        </div>
      )}
    </section>
  );
}

function WaitingCard({ person: p }: { person: Person }) {
  const who = displayName(p);
  return (
    <Link
      href={p.latestUnreadLetterId ? `/letter/${p.latestUnreadLetterId}` : `/people/${p.id}`}
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
}

function WaitingGlow() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute -inset-x-8 -top-12 bottom-0 -z-10 overflow-hidden"
    >
      <div className="absolute left-0 top-0 h-44 w-44 rounded-full bg-[#f0c9b8] opacity-50 blur-3xl" />
      <div className="absolute right-2 top-6 h-52 w-52 rounded-full bg-[#cbd9c0] opacity-45 blur-3xl" />
      <div className="absolute left-32 bottom-0 h-44 w-44 rounded-full bg-[#d9cbe6] opacity-40 blur-3xl" />
    </div>
  );
}
