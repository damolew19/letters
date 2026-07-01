import type { ReactNode } from "react";
import Link from "next/link";
import { AccountMenu } from "@/client/components/account-menu";

export function AppHeader({
  name,
  email,
  actions,
}: {
  name?: string | null;
  email?: string | null;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 border-b border-[#e7e0d6] pb-4">
      <Link
        href="/mailbox"
        className="font-serif text-xl tracking-tight text-[#2b2621] transition-colors hover:text-[#6f665c]"
      >
        Letters
      </Link>
      <div className="ml-auto flex items-center gap-3">
        {actions}
        {email ? <AccountMenu name={name} email={email} /> : null}
      </div>
    </div>
  );
}
