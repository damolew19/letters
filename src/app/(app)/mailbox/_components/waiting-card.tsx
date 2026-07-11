import Link from "next/link";
import type { Person } from "./feed-types";
import { displayName, formatDate, tintFor } from "./feed-utils";
import { Avatar } from "./feed-primitives";

export function WaitingCard({ person: p }: { person: Person }) {
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
