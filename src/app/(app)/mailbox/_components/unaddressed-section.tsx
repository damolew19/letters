import type { Draft } from "./feed-types";
import { formatDate } from "./feed-utils";
import { List, RowDate, RowLink, SectionLabel } from "./feed-primitives";

// Orphan drafts — not addressed to anyone yet.
export function UnaddressedSection({ drafts }: { drafts: Draft[] }) {
  return (
    <section>
      <SectionLabel>Not addressed yet</SectionLabel>
      <List>
        {drafts.map((d) => (
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
  );
}
