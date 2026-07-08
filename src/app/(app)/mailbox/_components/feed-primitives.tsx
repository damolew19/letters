import type { ReactNode } from "react";
import Link from "next/link";
import { initials } from "./feed-utils";

export function Avatar({
  seed,
  tint,
  large,
}: {
  seed: string;
  tint: { bg: string; fg: string };
  large?: boolean;
}) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-medium ${
        large ? "h-11 w-11 text-sm" : "h-9 w-9 text-xs"
      }`}
      style={{ background: tint.bg, color: tint.fg }}
      aria-hidden
    >
      {initials(seed)}
    </span>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-2 border-b border-[#e7e0d6] pb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-[#a89f95]">
      {children}
    </h3>
  );
}

export function List({ children }: { children: ReactNode }) {
  return <div className="divide-y divide-[#efe9df]">{children}</div>;
}

export function RowLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="flex w-full items-center gap-3 py-3 text-left transition-colors hover:bg-[#f4efe6]/60"
    >
      {children}
    </Link>
  );
}

export function StatePill({ children }: { children: ReactNode }) {
  return (
    <span className="shrink-0 rounded-full border border-[#e7d9c9] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#a1732f]">
      {children}
    </span>
  );
}

export function RowDate({ children }: { children: ReactNode }) {
  return (
    <span className="w-11 shrink-0 text-right text-xs tabular-nums text-[#c1b8ac]">
      {children}
    </span>
  );
}

export function EmptyNote({ children }: { children: ReactNode }) {
  return <p className="py-2 text-sm italic text-[#a89f95]">{children}</p>;
}

export function CardSkeletons() {
  return (
    <div className="flex flex-col gap-3">
      {[0, 1].map((i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-2xl border border-[#e7e0d6]/80 bg-white/50 p-4"
        >
          <span className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-[#ece5da]" />
          <span className="flex-1">
            <span className="mb-2 block h-4 w-40 animate-pulse rounded bg-[#ece5da]" />
            <span className="block h-3 w-28 animate-pulse rounded bg-[#f0ebe1]" />
          </span>
        </div>
      ))}
    </div>
  );
}
