import { eq, or, inArray } from "drizzle-orm";
import { db } from "@/db";
import { friendships, user } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "../trpc";

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
});
