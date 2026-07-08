"use client";

import {
  ToggleButton as AriaToggleButton,
  composeRenderProps,
  type ToggleButtonProps,
} from "react-aria-components";

/**
 * ToggleButton with shared focus/reset behaviour. Visual styling is passed per
 * instance via `className` (swatches, font chips, toolbar buttons all differ).
 */
export function ToggleButton({ className, ...props }: ToggleButtonProps) {
  return (
    <AriaToggleButton
      className={composeRenderProps(className, (resolved) =>
        ["outline-none", resolved].filter(Boolean).join(" "),
      )}
      {...props}
    />
  );
}
