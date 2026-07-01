import { createTRPCRouter } from "../lib/trpc";
import { inviteRouter } from "./invite";
import { friendsRouter } from "./friends";
import { lettersRouter } from "./letters";

export const appRouter = createTRPCRouter({
  invite: inviteRouter,
  friends: friendsRouter,
  letters: lettersRouter,
});

export type AppRouter = typeof appRouter;
