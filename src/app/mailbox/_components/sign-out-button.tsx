"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/client/lib/auth";
import { Button } from "@/client/components/ui/button";

export function SignOutButton() {
  const router = useRouter();

  async function onSignOut() {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <Button variant="link" onClick={onSignOut}>
      Sign out
    </Button>
  );
}
