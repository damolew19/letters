import { headers } from "next/headers";
import Link from "next/link";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/server/db";
import { invites, user } from "@/server/db/schema";
import { auth } from "@/server/auth";
import { MagicLinkForm } from "@/client/components/magic-link-form";
import { InviteAccept } from "./_components/invite-accept";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-stone-50 px-6 text-stone-900">
      <main className="w-full max-w-md">
        <div className="mb-10 text-center">
          <h1 className="font-serif text-4xl tracking-tight">Letters</h1>
        </div>
        {children}
      </main>
    </div>
  );
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const [invite] = await db
    .select({ inviterId: user.id, inviterName: user.name })
    .from(invites)
    .innerJoin(user, eq(invites.inviterId, user.id))
    .where(and(eq(invites.token, token), isNull(invites.revokedAt)))
    .limit(1);

  if (!invite) {
    return (
      <Shell>
        <div className="rounded-2xl border border-stone-200 bg-white p-6 text-center shadow-sm">
          <p className="font-medium">This invite link is no longer valid.</p>
          <p className="mt-2 text-sm text-stone-500">
            It may have been revoked. Ask your friend for a fresh link.
          </p>
        </div>
      </Shell>
    );
  }

  const inviterName = invite.inviterName || "Someone";
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return (
      <Shell>
        <p className="mb-6 text-center text-stone-600">
          <span className="font-medium text-stone-900">{inviterName}</span>{" "}
          invited you to exchange letters. Sign in to accept.
        </p>
        <MagicLinkForm callbackURL={`/invite/${token}`} />
      </Shell>
    );
  }

  if (session.user.id === invite.inviterId) {
    return (
      <Shell>
        <div className="rounded-2xl border border-stone-200 bg-white p-6 text-center shadow-sm">
          <p className="text-stone-600">This is your own invite link.</p>
          <Link
            href="/mailbox"
            className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-full bg-stone-900 px-5 text-sm font-medium text-stone-50 transition-colors hover:bg-stone-700"
          >
            Go to your mailbox
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <InviteAccept token={token} inviterName={invite.inviterName} />
    </Shell>
  );
}
