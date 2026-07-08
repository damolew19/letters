"use client";

import { trpc } from "@/client/lib/trpc";
import type { Draft, Person } from "./feed-types";
import { time } from "./feed-utils";
import { CardSkeletons, EmptyNote } from "./feed-primitives";
import { WaitingSection } from "./waiting-section";
import { CorrespondentsSection } from "./correspondents-section";
import { UnaddressedSection } from "./unaddressed-section";
import { InviteButton } from "./invite-button";

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
  const unaddressed = (drafts.data ?? []).filter((d) => !d.recipientId) as Draft[];

  const isEmpty = people.length === 0 && unaddressed.length === 0;

  return (
    <div>
      <div className="pt-9">
        {overview.isLoading ? (
          <CardSkeletons />
        ) : (
          <div className="flex flex-col gap-12">
            <WaitingSection people={waiting} />

            {correspondents.length > 0 && (
              <CorrespondentsSection people={correspondents} />
            )}

            {unaddressed.length > 0 && (
              <UnaddressedSection drafts={unaddressed} />
            )}

            {isEmpty && (
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
