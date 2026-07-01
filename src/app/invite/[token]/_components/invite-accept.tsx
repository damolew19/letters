"use client";

import { useRouter } from "next/navigation";
import { trpc } from "@/client/lib/trpc";
import { Button } from "@/client/components/ui/button";

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
      <Button
        onClick={() => accept.mutate({ token })}
        disabled={accept.isPending || accept.isSuccess}
        className="mt-4 h-11 w-full"
      >
        {accept.isPending || accept.isSuccess
          ? "Connecting…"
          : `Accept invitation`}
      </Button>
    </div>
  );
}
