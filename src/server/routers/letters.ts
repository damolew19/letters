import { and, desc, eq, isNotNull, isNull } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "@/server/db";
import { letters, friendships, user } from "@/server/db/schema";
import { createTRPCRouter, protectedProcedure } from "../lib/trpc";
import { orderPair } from "@/server/lib/invite";

// Throws unless `recipientId` is a confirmed friend of the current user.
async function assertFriend(meId: string, recipientId: string) {
  const [userAId, userBId] = orderPair(meId, recipientId);
  const [row] = await db
    .select({ id: friendships.id })
    .from(friendships)
    .where(
      and(
        eq(friendships.userAId, userAId),
        eq(friendships.userBId, userBId),
      ),
    )
    .limit(1);

  if (!row) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You can only write to your correspondents.",
    });
  }
}

// Loads a draft owned by the current user, or throws.
async function getOwnedDraft(id: string, meId: string) {
  const [letter] = await db
    .select()
    .from(letters)
    .where(eq(letters.id, id))
    .limit(1);

  if (!letter || letter.senderId !== meId) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Letter not found." });
  }
  if (letter.sealedAt) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "This letter has already been sent.",
    });
  }
  return letter;
}

export const lettersRouter = createTRPCRouter({
  createDraft: protectedProcedure.mutation(async ({ ctx }) => {
    const [draft] = await db
      .insert(letters)
      .values({ senderId: ctx.user.id })
      .returning({ id: letters.id });
    return { id: draft.id };
  }),

  getDraft: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return getOwnedDraft(input.id, ctx.user.id);
    }),

  saveDraft: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        content: z.unknown().optional(),
        excerpt: z.string().optional(),
        recipientId: z.string().nullable().optional(),
        paper: z.string().optional(),
        ink: z.string().optional(),
        font: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await getOwnedDraft(input.id, ctx.user.id);

      if (input.recipientId) {
        await assertFriend(ctx.user.id, input.recipientId);
      }

      const updates: Partial<typeof letters.$inferInsert> = {
        updatedAt: new Date(),
      };
      if (input.content !== undefined) updates.content = input.content;
      if (input.excerpt !== undefined) updates.excerpt = input.excerpt;
      if (input.recipientId !== undefined)
        updates.recipientId = input.recipientId;
      if (input.paper !== undefined) updates.paper = input.paper;
      if (input.ink !== undefined) updates.ink = input.ink;
      if (input.font !== undefined) updates.font = input.font;

      await db.update(letters).set(updates).where(eq(letters.id, input.id));
      return { savedAt: updates.updatedAt };
    }),

  listDrafts: protectedProcedure.query(async ({ ctx }) => {
    const rows = await db
      .select({
        id: letters.id,
        excerpt: letters.excerpt,
        recipientId: letters.recipientId,
        recipientName: user.name,
        recipientEmail: user.email,
        updatedAt: letters.updatedAt,
      })
      .from(letters)
      .leftJoin(user, eq(letters.recipientId, user.id))
      .where(and(eq(letters.senderId, ctx.user.id), isNull(letters.sealedAt)))
      .orderBy(desc(letters.updatedAt));
    return rows;
  }),

  // Letters delivered to the current user. Metadata only; the body is loaded
  // separately when a letter is opened. `openedAt` drives the mailbox red flag.
  listReceived: protectedProcedure.query(async ({ ctx }) => {
    const rows = await db
      .select({
        id: letters.id,
        senderName: user.name,
        senderEmail: user.email,
        paper: letters.paper,
        sealedAt: letters.sealedAt,
        openedAt: letters.openedAt,
      })
      .from(letters)
      .leftJoin(user, eq(letters.senderId, user.id))
      .where(
        and(
          eq(letters.recipientId, ctx.user.id),
          isNotNull(letters.sealedAt),
        ),
      )
      .orderBy(desc(letters.sealedAt));
    return rows;
  }),

  // Full body of a received letter. Read-only so it can be re-read from the
  // keepsake box; opening is stamped separately via `markOpened`.
  getReceived: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [letter] = await db
        .select({
          id: letters.id,
          recipientId: letters.recipientId,
          content: letters.content,
          paper: letters.paper,
          ink: letters.ink,
          font: letters.font,
          senderName: user.name,
          senderEmail: user.email,
          sealedAt: letters.sealedAt,
          openedAt: letters.openedAt,
        })
        .from(letters)
        .leftJoin(user, eq(letters.senderId, user.id))
        .where(eq(letters.id, input.id))
        .limit(1);

      if (!letter || !letter.sealedAt || letter.recipientId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Letter not found." });
      }

      const { recipientId, ...rest } = letter;
      void recipientId;
      return rest;
    }),

  // Stamp the first-open time. Idempotent: re-opens leave `openedAt` untouched.
  markOpened: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .update(letters)
        .set({ openedAt: new Date() })
        .where(
          and(
            eq(letters.id, input.id),
            eq(letters.recipientId, ctx.user.id),
            isNull(letters.openedAt),
          ),
        );
      return { ok: true as const };
    }),

  // Metadata only: the sender cannot read a letter's content/excerpt once
  // it has been sealed, so neither field is selected here.
  listSent: protectedProcedure.query(async ({ ctx }) => {
    const rows = await db
      .select({
        id: letters.id,
        recipientName: user.name,
        recipientEmail: user.email,
        sealedAt: letters.sealedAt,
        openedAt: letters.openedAt,
      })
      .from(letters)
      .leftJoin(user, eq(letters.recipientId, user.id))
      .where(
        and(eq(letters.senderId, ctx.user.id), isNotNull(letters.sealedAt)),
      )
      .orderBy(desc(letters.sealedAt));
    return rows;
  }),

  send: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const draft = await getOwnedDraft(input.id, ctx.user.id);

      if (!draft.recipientId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Choose a correspondent before sending.",
        });
      }
      if (!draft.excerpt || draft.excerpt.trim().length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Write something before sending.",
        });
      }

      await assertFriend(ctx.user.id, draft.recipientId);

      await db
        .update(letters)
        .set({ sealedAt: new Date() })
        .where(eq(letters.id, input.id));
      return { ok: true as const };
    }),
});
