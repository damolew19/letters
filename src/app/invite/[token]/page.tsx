import { headers } from "next/headers";
import Link from "next/link";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/server/db";
import { invites, user } from "@/server/db/schema";
import { auth } from "@/server/auth";
import { MagicLinkForm } from "@/client/components/magic-link-form";
import { InviteAccept } from "./_components/invite-accept";
import { InviteShell } from "./_components/invite-shell";

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
      <InviteShell>
        <div className="rounded-2xl border border-stone-200 bg-white p-6 text-center shadow-sm">
          <p className="font-medium">This invite link is no longer valid.</p>
          <p className="mt-2 text-sm text-stone-500">
            It may have been revoked. Ask your friend for a fresh link.
          </p>
        </div>
      </InviteShell>
    );
  }

  const inviterName = invite.inviterName || "Someone";
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return (
      <InviteShell>
        <p className="mb-6 text-center text-stone-600">
          <span className="font-medium text-stone-900">{inviterName}</span>{" "}
          invited you to exchange letters. Sign in to accept.
        </p>
        <MagicLinkForm callbackURL={`/invite/${token}`} />
      </InviteShell>
    );
  }

  if (session.user.id === invite.inviterId) {
    return (
      <InviteShell>
        <div className="rounded-2xl border border-stone-200 bg-white p-6 text-center shadow-sm">
          <p className="text-stone-600">This is your own invite link.</p>
          <Link
            href="/mailbox"
            className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-full bg-stone-900 px-5 text-sm font-medium text-stone-50 transition-colors hover:bg-stone-700"
          >
            Go to your mailbox
          </Link>
        </div>
      </InviteShell>
    );
  }

  return (
    <InviteShell>
      <InviteAccept token={token} inviterName={invite.inviterName} />
    </InviteShell>
  );
}
