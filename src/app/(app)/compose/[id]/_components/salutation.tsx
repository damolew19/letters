"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/client/components/ui/button";

export function Salutation({
  friends,
  recipientId,
  ink,
  onSelect,
}: {
  friends: { id: string; name: string | null; email: string }[];
  recipientId: string | null;
  ink: string;
  onSelect: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const recipient = friends.find((f) => f.id === recipientId);
  const recipientName = recipient ? recipient.name || recipient.email : null;

  return (
    <div className="text-[1.375rem] leading-relaxed">
      Dear{" "}
      <span ref={rootRef} className="relative">
        <Button
          variant="unstyled"
          onPress={() => setOpen((o) => !o)}
          className="inline-flex cursor-pointer items-baseline gap-1.5 border-b-2 border-dashed bg-transparent px-0.5 pb-px outline-none"
          style={{ color: ink, borderColor: `${ink}66` }}
        >
          {recipientName ?? "choose a correspondent"}
          <svg
            width={12}
            height={12}
            viewBox="0 0 12 12"
            fill="none"
            className="self-center"
            aria-hidden
          >
            <path
              d="M3 4.5L6 7.5L9 4.5"
              stroke="currentColor"
              strokeWidth={1.4}
              strokeLinecap="round"
            />
          </svg>
        </Button>
        {open && (
          <span
            className="absolute left-0 top-full z-20 mt-2 block min-w-52 rounded-xl border border-stone-200 bg-white p-1 font-sans text-sm shadow-lg"
            style={{ fontFamily: "var(--font-sans, system-ui, sans-serif)" }}
          >
            {friends.length === 0 ? (
              <span className="block px-3 py-2 text-xs text-stone-400">
                No correspondents yet. Invite someone from your mailbox.
              </span>
            ) : (
              friends.map((f) => (
                <Button
                  variant="unstyled"
                  key={f.id}
                  onPress={() => {
                    onSelect(f.id);
                    setOpen(false);
                  }}
                  className={`block w-full rounded-lg px-3 py-1.5 text-left outline-none transition-colors ${
                    f.id === recipientId
                      ? "bg-stone-100 text-stone-900"
                      : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                  }`}
                >
                  {f.name || f.email}
                </Button>
              ))
            )}
          </span>
        )}
      </span>
      ,
    </div>
  );
}
