"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();

  async function onSignOut() {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={onSignOut}
      className="text-sm text-stone-500 underline underline-offset-4 hover:text-stone-900"
    >
      Sign out
    </button>
  );
}
