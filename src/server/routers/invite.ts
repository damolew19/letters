import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "@/server/db";
import { invites, friendships, user } from "@/server/db/schema";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../lib/trpc";
import { generateInviteToken, inviteUrl, orderPair } from "@/server/lib/invite";

async function getOrCreateToken(inviterId: string) {
  const [existing] = await db
    .select({ token: invites.token })
    .from(invites)
    .where(and(eq(invites.inviterId, inviterId), isNull(invites.revokedAt)))
    .limit(1);

  if (existing) return existing.token;

  const token = generateInviteToken();
  await db.insert(invites).values({ inviterId, token });
  return token;
}

export const inviteRouter = createTRPCRouter({
  getMyLink: protectedProcedure.query(async ({ ctx }) => {
    const token = await getOrCreateToken(ctx.user.id);
    return { token, url: inviteUrl(token) };
  }),

  rotate: protectedProcedure.mutation(async ({ ctx }) => {
    await db
      .update(invites)
      .set({ revokedAt: new Date() })
      .where(and(eq(invites.inviterId, ctx.user.id), isNull(invites.revokedAt)));

    const token = generateInviteToken();
    await db.insert(invites).values({ inviterId: ctx.user.id, token });
    return { token, url: inviteUrl(token) };
  }),

  // Public: lets the accept page show who invited you before sign-in.
  preview: publicProcedure
    .input(z.object({ token: z.string().min(1) }))
    .query(async ({ input }) => {
      const [row] = await db
        .select({ inviterId: user.id, inviterName: user.name })
        .from(invites)
        .innerJoin(user, eq(invites.inviterId, user.id))
        .where(and(eq(invites.token, input.token), isNull(invites.revokedAt)))
        .limit(1);

      if (!row) return { valid: false as const };
      return {
        valid: true as const,
        inviterId: row.inviterId,
        inviterName: row.inviterName || null,
      };
    }),

  accept: protectedProcedure
    .input(z.object({ token: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const [invite] = await db
        .select({ inviterId: invites.inviterId })
        .from(invites)
        .where(and(eq(invites.token, input.token), isNull(invites.revokedAt)))
        .limit(1);

      if (!invite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "This invite link is invalid or has been revoked.",
        });
      }

      if (invite.inviterId === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You can't accept your own invite link.",
        });
      }

      const [userAId, userBId] = orderPair(invite.inviterId, ctx.user.id);
      await db
        .insert(friendships)
        .values({ userAId, userBId })
        .onConflictDoNothing();

      return { ok: true as const };
    }),
});
