import { initTRPC, TRPCError } from "@trpc/server";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";

export const createTRPCContext = async (opts: FetchCreateContextFnOptions) => {
  const session = await auth.api.getSession({ headers: opts.req.headers });
  return {
    session: session?.session ?? null,
    user: session?.user ?? null,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user || !ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: { ...ctx, user: ctx.user, session: ctx.session },
  });
});
