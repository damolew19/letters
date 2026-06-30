"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

type Status = "idle" | "loading" | "sent" | "error";

export default function Home() {
  const { data: session, isPending } = authClient.useSession();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");

    const { error } = await authClient.signIn.magicLink({
      email,
      callbackURL: "/mailbox",
    });

    if (error) {
      setStatus("error");
      setError(error.message ?? "Something went wrong. Please try again.");
      return;
    }
    setStatus("sent");
  }

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
        ) : status === "sent" ? (
          <div className="rounded-2xl border border-stone-200 bg-white p-6 text-center shadow-sm">
            <p className="font-medium">Check your inbox</p>
            <p className="mt-2 text-sm text-stone-500">
              We sent a sign-in link to{" "}
              <span className="text-stone-900">{email}</span>. The link expires
              in 5 minutes.
            </p>
            <button
              onClick={() => setStatus("idle")}
              className="mt-4 text-sm text-stone-500 underline underline-offset-4 hover:text-stone-900"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
          >
            <label
              htmlFor="email"
              className="block text-sm font-medium text-stone-700"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-2 h-11 w-full rounded-lg border border-stone-300 bg-white px-3 text-stone-900 outline-none placeholder:text-stone-400 focus:border-stone-900"
            />
            {status === "error" && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
            <button
              type="submit"
              disabled={status === "loading"}
              className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-full bg-stone-900 px-5 text-sm font-medium text-stone-50 transition-colors hover:bg-stone-700 disabled:opacity-60"
            >
              {status === "loading" ? "Sending link…" : "Send me a sign-in link"}
            </button>
            <p className="mt-3 text-center text-xs text-stone-400">
              No passwords. We email you a magic link.
            </p>
          </form>
        )}
      </main>
    </div>
  );
}
