"use client";

import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { MagicLinkForm } from "@/components/magic-link-form";

export default function Home() {
  const { data: session, isPending } = authClient.useSession();

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-stone-50 px-6 text-stone-900">
      <main className="w-full max-w-md">
        <div className="mb-10 text-center">
          <h1 className="font-serif text-4xl tracking-tight">Letters</h1>
          <p className="mt-3 text-balance text-stone-500">
            Slow, handwritten-feeling letters for the few people who matter.
          </p>
        </div>

        {!isPending && session ? (
          <div className="rounded-2xl border border-stone-200 bg-white p-6 text-center shadow-sm">
            <p className="text-stone-600">
              Signed in as{" "}
              <span className="font-medium text-stone-900">
                {session.user.email}
              </span>
            </p>
            <Link
              href="/mailbox"
              className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-full bg-stone-900 px-5 text-sm font-medium text-stone-50 transition-colors hover:bg-stone-700"
            >
              Go to your mailbox
            </Link>
          </div>
        ) : (
          <MagicLinkForm callbackURL="/mailbox" />
        )}
      </main>
    </div>
  );
}
