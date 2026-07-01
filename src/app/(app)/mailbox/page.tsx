import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { AppHeader } from "@/client/components/app-header";
import { LetterFeed } from "./_components/letter-feed";

export default async function MailboxPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  // Real authorization check (proxy.ts only does an optimistic cookie check).
  if (!session) {
    redirect("/");
  }

  return (
    <>
      <AppHeader name={session.user.name} email={session.user.email} />
      <LetterFeed />
    </>
  );
}
