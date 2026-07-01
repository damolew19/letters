"use client";

import { useRouter } from "next/navigation";
import { trpc } from "@/client/lib/trpc";

export function InviteAccept({
  token,
  inviterName,
}: {
  token: string;
  inviterName: string | null;
}) {
  const router = useRouter();
  const accept = trpc.invite.accept.useMutation({
    onSuccess: () => {
      router.push("/mailbox");
      router.refresh();
    },
  });

  const name = inviterName || "Someone";

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 text-center shadow-sm">
      <p className="text-stone-700">
        <span className="font-medium text-stone-900">{name}</span> invited you to
        exchange letters.
      </p>
      {accept.error && (
        <p className="mt-3 text-sm text-red-600">{accept.error.message}</p>
      )}
      <button
        onClick={() => accept.mutate({ token })}
        disabled={accept.isPending || accept.isSuccess}
        className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-full bg-stone-900 px-5 text-sm font-medium text-stone-50 transition-colors hover:bg-stone-700 disabled:opacity-60"
      >
        {accept.isPending || accept.isSuccess
          ? "Connecting…"
          : `Accept invitation`}
      </button>
    </div>
  );
}
