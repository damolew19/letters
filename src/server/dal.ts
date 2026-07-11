import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";

// Real authorization check for the (app) segment. proxy.ts only does an
// optimistic cookie check, so pages must call this to actually gate access.
// Wrapped in React `cache` so repeated calls within one request (e.g. the
// layout for display + a page for the gate) share a single session fetch.
export const requireSession = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/");
  }
  return session;
});
