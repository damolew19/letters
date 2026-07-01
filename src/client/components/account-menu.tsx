"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const [open, setOpen] = useState(false);

  async function onSignOut() {
    setOpen(false);
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Account"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e2dacd] bg-[#fffdf9] text-xs font-semibold tracking-wide text-[#6f665c] transition-colors hover:border-[#d3c9b8]"
      >
        {initials(name, email)}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          <div className="absolute right-0 top-11 z-20 min-w-44 rounded-xl border border-[#e7e0d6] bg-[#fffdf9] p-1.5 shadow-[0_8px_30px_rgba(60,50,40,0.08)]">
            <div className="px-2.5 py-2">
              <p className="truncate text-sm text-[#2b2621]">{name || "You"}</p>
              <p className="truncate text-xs text-[#a89f95]">{email}</p>
            </div>
            <div className="my-1 h-px bg-[#efe9df]" />
            <Link
              href="/mailbox"
              onClick={() => setOpen(false)}
              className="block rounded-lg px-2.5 py-1.5 text-sm text-[#2b2621] transition-colors hover:bg-[#f4efe6]"
            >
              Mailbox
            </Link>
            <div className="my-1 h-px bg-[#efe9df]" />
            <button
              type="button"
              onClick={onSignOut}
              className="block w-full rounded-lg px-2.5 py-1.5 text-left text-sm text-[#8a8178] transition-colors hover:bg-[#f4efe6]"
            >
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
