import { and, desc, eq, inArray, isNotNull, isNull, or } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "@/server/db";
import { friendships, letters, user } from "@/server/db/schema";
import { createTRPCRouter, protectedProcedure } from "../lib/trpc";
import { orderPair } from "@/server/lib/invite";

// Pull the plain text out of a Tiptap/ProseMirror document so we can count
// words. The document is a tree of nodes; text lives on `text` leaves.
function extractText(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const n = node as { text?: unknown; content?: unknown };
  let out = typeof n.text === "string" ? n.text : "";
  if (Array.isArray(n.content)) {
    for (const child of n.content) out += " " + extractText(child);
  }
  return out;
}

function countWords(content: unknown): number {
  const text = extractText(content).trim();
  return text ? text.split(/\s+/).length : 0;
}

// Average adult silent reading pace, used to turn a word count into minutes.
const WORDS_PER_MINUTE = 200;

export const friendsRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const me = ctx.user.id;

    const rows = await db
      .select({ userAId: friendships.userAId, userBId: friendships.userBId })
      .from(friendships)
      .where(or(eq(friendships.userAId, me), eq(friendships.userBId, me)));

    const otherIds = rows.map((r) => (r.userAId === me ? r.userBId : r.userAId));
    if (otherIds.length === 0) return [];

    return db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      })
      .from(user)
      .where(inArray(user.id, otherIds));
  }),

  // Per-correspondent summary powering the people-first mailbox: for each
  // person, what's waiting, whose turn it is, and the latest activity.
  overview: protectedProcedure.query(async ({ ctx }) => {
    const me = ctx.user.id;

    const friendRows = await db
      .select({ userAId: friendships.userAId, userBId: friendships.userBId })
      .from(friendships)
      .where(or(eq(friendships.userAId, me), eq(friendships.userBId, me)));
    const friendIds = friendRows.map((r) =>
      r.userAId === me ? r.userBId : r.userAId,
    );
    if (friendIds.length === 0) return [];

    const people = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      })
      .from(user)
      .where(inArray(user.id, friendIds));

    const received = await db
      .select({
        id: letters.id,
        senderId: letters.senderId,
        sealedAt: letters.sealedAt,
        openedAt: letters.openedAt,
      })
      .from(letters)
      .where(
        and(
          eq(letters.recipientId, me),
          isNotNull(letters.sealedAt),
          inArray(letters.senderId, friendIds),
        ),
      );

    const sent = await db
      .select({
        recipientId: letters.recipientId,
        sealedAt: letters.sealedAt,
        openedAt: letters.openedAt,
      })
      .from(letters)
      .where(
        and(
          eq(letters.senderId, me),
          isNotNull(letters.sealedAt),
          inArray(letters.recipientId, friendIds),
        ),
      );

    const drafts = await db
      .select({
        id: letters.id,
        recipientId: letters.recipientId,
        excerpt: letters.excerpt,
        updatedAt: letters.updatedAt,
      })
      .from(letters)
      .where(
        and(
          eq(letters.senderId, me),
          isNull(letters.sealedAt),
          inArray(letters.recipientId, friendIds),
        ),
      )
      .orderBy(desc(letters.updatedAt));

    type Acc = {
      unreadCount: number;
      latestArrivedAt: Date | null;
      latestUnreadLetterId: string | null;
      lastActivityAt: Date | null;
      lastDir: "in" | "out" | null;
      lastOutAt: Date | null;
      lastOutOpened: boolean;
      draft: { id: string; excerpt: string | null; updatedAt: Date } | null;
    };
    const acc = new Map<string, Acc>(
      people.map((p) => [
        p.id,
        {
          unreadCount: 0,
          latestArrivedAt: null,
          latestUnreadLetterId: null,
          lastActivityAt: null,
          lastDir: null,
          lastOutAt: null,
          lastOutOpened: false,
          draft: null,
        },
      ]),
    );

    for (const r of received) {
      const a = acc.get(r.senderId);
      if (!a || !r.sealedAt) continue;
      if (!r.openedAt) {
        a.unreadCount += 1;
        if (!a.latestArrivedAt || r.sealedAt > a.latestArrivedAt) {
          a.latestArrivedAt = r.sealedAt;
          a.latestUnreadLetterId = r.id;
        }
      }
      if (!a.lastActivityAt || r.sealedAt > a.lastActivityAt) {
        a.lastActivityAt = r.sealedAt;
        a.lastDir = "in";
      }
    }

    for (const s of sent) {
      if (!s.recipientId || !s.sealedAt) continue;
      const a = acc.get(s.recipientId);
      if (!a) continue;
      if (!a.lastActivityAt || s.sealedAt > a.lastActivityAt) {
        a.lastActivityAt = s.sealedAt;
        a.lastDir = "out";
      }
      if (!a.lastOutAt || s.sealedAt > a.lastOutAt) {
        a.lastOutAt = s.sealedAt;
        a.lastOutOpened = !!s.openedAt;
      }
    }

    for (const d of drafts) {
      if (!d.recipientId) continue;
      const a = acc.get(d.recipientId);
      // Drafts arrive newest-first, so the first one wins.
      if (a && !a.draft) {
        a.draft = { id: d.id, excerpt: d.excerpt, updatedAt: d.updatedAt };
      }
    }

    return people.map((p) => {
      const a = acc.get(p.id)!;
      return {
        id: p.id,
        name: p.name,
        email: p.email,
        image: p.image,
        unreadCount: a.unreadCount,
        latestArrivedAt: a.latestArrivedAt,
        latestUnreadLetterId: a.latestUnreadLetterId,
        lastActivityAt: a.lastActivityAt,
        lastDir: a.lastDir,
        lastOutOpened: a.lastOutOpened,
        draft: a.draft,
      };
    });
  }),

  // The "connection" between the current user and one correspondent: the whole
  // relationship as a keepsake — how many letters, the rhythm over time, how
  // much you've read, and the letter you're mid-writing to them.
  connection: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const me = ctx.user.id;
      const them = input.id;

      // Only correspondents have a connection page.
      const [userAId, userBId] = orderPair(me, them);
      const [friendship] = await db
        .select({ id: friendships.id })
        .from(friendships)
        .where(
          and(eq(friendships.userAId, userAId), eq(friendships.userBId, userBId)),
        )
        .limit(1);
      if (!friendship) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Not a correspondent." });
      }

      const [person] = await db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        })
        .from(user)
        .where(eq(user.id, them))
        .limit(1);
      if (!person) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Person not found." });
      }

      // Every sealed letter that has passed between the two of you.
      const sealed = await db
        .select({
          id: letters.id,
          senderId: letters.senderId,
          content: letters.content,
          sealedAt: letters.sealedAt,
          openedAt: letters.openedAt,
        })
        .from(letters)
        .where(
          and(
            isNotNull(letters.sealedAt),
            or(
              and(eq(letters.senderId, me), eq(letters.recipientId, them)),
              and(eq(letters.senderId, them), eq(letters.recipientId, me)),
            ),
          ),
        )
        .orderBy(desc(letters.sealedAt));

      // The letter you're currently writing to them, if any.
      const [draft] = await db
        .select({
          id: letters.id,
          excerpt: letters.excerpt,
          updatedAt: letters.updatedAt,
        })
        .from(letters)
        .where(
          and(
            eq(letters.senderId, me),
            eq(letters.recipientId, them),
            isNull(letters.sealedAt),
          ),
        )
        .orderBy(desc(letters.updatedAt))
        .limit(1);

      let sent = 0;
      let received = 0;
      let wordsRead = 0;
      const history = sealed.map((l) => {
        const dir = l.senderId === me ? ("out" as const) : ("in" as const);
        const words = dir === "in" ? countWords(l.content) : null;
        if (dir === "out") sent += 1;
        else {
          received += 1;
          wordsRead += words ?? 0;
        }
        return { id: l.id, dir, sealedAt: l.sealedAt, openedAt: l.openedAt, words };
      });

      // The exchange rhythm across the last 8 months, split by author.
      const now = new Date();
      const timeline = Array.from({ length: 8 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (7 - i), 1);
        return {
          key: `${d.getFullYear()}-${d.getMonth()}`,
          label: d.toLocaleString("en-US", { month: "short" }),
          you: 0,
          them: 0,
        };
      });
      const byMonth = new Map(timeline.map((m) => [m.key, m]));
      for (const l of sealed) {
        if (!l.sealedAt) continue;
        const d = new Date(l.sealedAt);
        const bucket = byMonth.get(`${d.getFullYear()}-${d.getMonth()}`);
        if (bucket) {
          if (l.senderId === me) bucket.you += 1;
          else bucket.them += 1;
        }
      }

      const since = sealed.at(-1)?.sealedAt ?? null;
      let months = 0;
      if (since) {
        const s = new Date(since);
        months = Math.max(
          1,
          (now.getFullYear() - s.getFullYear()) * 12 +
            (now.getMonth() - s.getMonth()) +
            1,
        );
      }

      return {
        person,
        totals: { total: sealed.length, sent, received },
        since,
        months,
        wordsRead,
        readingMinutes: Math.round(wordsRead / WORDS_PER_MINUTE),
        timeline: timeline.map(({ label, you, them }) => ({ label, you, them })),
        draft: draft ?? null,
        history,
      };
    }),
});
