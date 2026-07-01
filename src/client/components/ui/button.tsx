import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "ghost" | "link";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "inline-flex h-10 items-center justify-center rounded-full bg-stone-900 px-5 text-sm font-medium text-stone-50 transition-colors hover:bg-stone-700 disabled:opacity-50",
  ghost:
    "inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 disabled:opacity-50",
  link: "text-sm text-stone-500 underline underline-offset-4 transition-colors hover:text-stone-900 disabled:opacity-50",
};

export function Button({
  variant = "primary",
  className,
  type,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type ?? "button"}
      className={[variantClasses[variant], className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}
