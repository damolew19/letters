import type { Person } from "./feed-types";
import { displayName, formatDate, status, tintFor } from "./feed-utils";
import { Avatar, List, RowDate, RowLink, SectionLabel, StatePill } from "./feed-primitives";

// The relationships, not folders.
export function CorrespondentsSection({ people }: { people: Person[] }) {
  return (
    <section>
      <SectionLabel>Your correspondents</SectionLabel>
      <List>
        {people.map((p) => {
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
              <RowDate>{formatDate(p.draft?.updatedAt ?? p.lastActivityAt)}</RowDate>
            </RowLink>
          );
        })}
      </List>
    </section>
  );
}
