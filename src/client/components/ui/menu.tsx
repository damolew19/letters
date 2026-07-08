"use client";

import {
  Menu as AriaMenu,
  MenuItem as AriaMenuItem,
  composeRenderProps,
  type MenuItemProps,
  type MenuProps,
} from "react-aria-components";

export function Menu<T extends object>({ className, ...props }: MenuProps<T>) {
  return (
    <AriaMenu
      className={composeRenderProps(className, (resolved) =>
        ["outline-none", resolved].filter(Boolean).join(" "),
      )}
      {...props}
    />
  );
}

const itemBase =
  "block cursor-pointer rounded-lg px-2.5 py-1.5 text-sm outline-none transition-colors hover:bg-[#f4efe6] data-focused:bg-[#f4efe6]";

export function MenuItem({ className, ...props }: MenuItemProps) {
  return (
    <AriaMenuItem
      className={composeRenderProps(className, (resolved) =>
        [itemBase, resolved].filter(Boolean).join(" "),
      )}
      {...props}
    />
  );
}
