import { createTRPCRouter } from "../trpc";
import { inviteRouter } from "./invite";
import { friendsRouter } from "./friends";

export const appRouter = createTRPCRouter({
  invite: inviteRouter,
  friends: friendsRouter,
});

export type AppRouter = typeof appRouter;
