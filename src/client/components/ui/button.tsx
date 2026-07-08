"use client";

import {
  Button as AriaButton,
  composeRenderProps,
  type ButtonProps as AriaButtonProps,
} from "react-aria-components";

type ButtonVariant = "primary" | "accent" | "ghost" | "link" | "unstyled";

type ButtonProps = AriaButtonProps & {
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "inline-flex h-10 items-center justify-center rounded-full bg-stone-900 px-5 text-sm font-medium text-stone-50 transition-colors hover:bg-stone-700 disabled:opacity-50",
  // The warm brand CTA used across the mailbox/compose/people surfaces.
  accent:
    "inline-flex items-center justify-center rounded-full bg-[#bc6c47] px-4 py-2 text-sm font-medium text-[#faf7f2] transition-colors hover:bg-[#a1542f] disabled:opacity-60",
  ghost:
    "inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 disabled:opacity-50",
  link: "text-sm text-stone-500 underline underline-offset-4 transition-colors hover:text-stone-900 disabled:opacity-50",
  // Opt out of the design-system variants when a caller needs fully bespoke styling.
  unstyled: "",
};

export function Button({
  variant = "primary",
  className,
  type,
  ...props
}: ButtonProps) {
  return (
    <AriaButton
      type={type ?? "button"}
      className={composeRenderProps(className, (resolved) =>
        [variantClasses[variant], resolved].filter(Boolean).join(" "),
      )}
      {...props}
    />
  );
}
