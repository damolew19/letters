import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SignOutButton } from "@/components/sign-out-button";

export default async function MailboxPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  // Real authorization check (proxy.ts only does an optimistic cookie check).
  if (!session) {
    redirect("/");
  }

  return (
    <div className="flex min-h-dvh flex-col bg-stone-50 text-stone-900">
      <header className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
        <span className="font-serif text-xl">Letters</span>
        <SignOutButton />
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
        <h1 className="font-serif text-3xl tracking-tight">Your mailbox</h1>
        <p className="mt-2 text-stone-500">
          Welcome,{" "}
          <span className="text-stone-900">
            {session.user.name || session.user.email}
          </span>
          .
        </p>
        <div className="mt-10 rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-stone-400">
          No letters yet. Friends &amp; composing come next.
        </div>
      </main>
    </div>
  );
}
