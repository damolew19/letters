import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { SignOutButton } from "./_components/sign-out-button";
import { InvitePanel } from "./_components/invite-panel";
import { FriendsList } from "./_components/friends-list";
import { DraftsPanel } from "./_components/drafts-panel";
import { SentPanel } from "./_components/sent-panel";
import { ReceivedPanel } from "./_components/received-panel";

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
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
        <h1 className="font-serif text-3xl tracking-tight">Your mailbox</h1>
        <p className="mt-2 text-stone-500">
          Welcome,{" "}
          <span className="text-stone-900">
            {session.user.name || session.user.email}
          </span>
          .
        </p>

        <div className="mt-10 grid gap-5">
          <ReceivedPanel />
          <DraftsPanel />
          <SentPanel />
          <InvitePanel />
          <FriendsList />
        </div>
      </main>
    </div>
  );
}
