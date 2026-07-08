"use client";

import { useRouter } from "next/navigation";
import { MenuTrigger, Popover, Separator } from "react-aria-components";
import { Button } from "@/client/components/ui/button";
import { Menu, MenuItem } from "@/client/components/ui/menu";
import { authClient } from "@/client/lib/auth";

function initials(name?: string | null, email?: string) {
  const source = (name ?? email ?? "").trim();
  if (!source) return "·";
  const parts = source.split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function AccountMenu({
  name,
  email,
}: {
  name?: string | null;
  email: string;
}) {
  const router = useRouter();

  async function onSignOut() {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  function onAction(key: React.Key) {
    if (key === "mailbox") router.push("/mailbox");
    if (key === "signout") void onSignOut();
  }

  return (
    <MenuTrigger>
      <Button
        variant="unstyled"
        aria-label="Account"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e2dacd] bg-[#fffdf9] text-xs font-semibold tracking-wide text-[#6f665c] outline-none transition-colors hover:border-[#d3c9b8]"
      >
        {initials(name, email)}
      </Button>

      <Popover
        placement="bottom end"
        offset={8}
        className="min-w-44 rounded-xl border border-[#e7e0d6] bg-[#fffdf9] p-1.5 shadow-[0_8px_30px_rgba(60,50,40,0.08)]"
      >
        <div className="px-2.5 py-2">
          <p className="truncate text-sm text-[#2b2621]">{name || "You"}</p>
          <p className="truncate text-xs text-[#a89f95]">{email}</p>
        </div>
        <Separator className="my-1 h-px bg-[#efe9df]" />
        <Menu onAction={onAction}>
          <MenuItem id="mailbox" className="text-[#2b2621]">
            Mailbox
          </MenuItem>
          <Separator className="my-1 h-px bg-[#efe9df]" />
          <MenuItem id="signout" className="text-[#8a8178]">
            Sign out
          </MenuItem>
        </Menu>
      </Popover>
    </MenuTrigger>
  );
}
