"use client";

import {
  Dialog,
  Modal as AriaModal,
  ModalOverlay,
  type DialogProps,
  type ModalOverlayProps,
} from "react-aria-components";

type Variant = "center" | "sheet";

const overlayClass: Record<Variant, string> = {
  center:
    "fixed inset-0 z-40 flex items-center justify-center bg-stone-900/40 p-6",
  sheet:
    "fixed inset-0 z-40 flex items-end justify-center bg-[#2b2621]/40 sm:items-center sm:p-6",
};

const boxClass: Record<Variant, string> = {
  center: "w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl",
  sheet:
    "w-full rounded-t-2xl bg-[#fffdf9] p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[0_-8px_40px_rgba(60,50,40,0.12)] sm:max-w-md sm:rounded-2xl sm:pb-6 sm:shadow-[0_20px_60px_rgba(60,50,40,0.18)]",
};

type ModalProps = Omit<ModalOverlayProps, "children" | "className"> & {
  variant?: Variant;
  role?: DialogProps["role"];
  children: DialogProps["children"];
};

/**
 * Composes ModalOverlay + Modal + Dialog with dismiss behaviour and two
 * layout variants. Works both controlled (isOpen/onOpenChange) and inside a
 * <DialogTrigger>. Children may be a render function receiving `{ close }`.
 */
export function Modal({
  variant = "center",
  role,
  isDismissable = true,
  children,
  ...props
}: ModalProps) {
  return (
    <ModalOverlay
      isDismissable={isDismissable}
      className={overlayClass[variant]}
      {...props}
    >
      <AriaModal className={boxClass[variant]}>
        <Dialog role={role} className="outline-none">
          {children}
        </Dialog>
      </AriaModal>
    </ModalOverlay>
  );
}
