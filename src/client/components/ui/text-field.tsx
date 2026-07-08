"use client";

import {
  FieldError,
  Input,
  Label,
  TextField as AriaTextField,
  composeRenderProps,
  type InputProps,
  type TextFieldProps as AriaTextFieldProps,
} from "react-aria-components";

type TextFieldProps = Omit<AriaTextFieldProps, "children"> & {
  label?: string;
  placeholder?: string;
  errorMessage?: string;
  /** Override the default form-field input styling. */
  inputClassName?: string;
  /** Escape hatch for native input props (readOnly, onFocus, …). */
  inputProps?: Omit<InputProps, "className">;
};

const defaultInput =
  "mt-2 h-11 w-full rounded-lg border border-stone-300 bg-white px-3 text-stone-900 outline-none placeholder:text-stone-400 focus:border-stone-900";

export function TextField({
  label,
  placeholder,
  errorMessage,
  inputClassName,
  inputProps,
  className,
  isInvalid,
  ...props
}: TextFieldProps) {
  return (
    <AriaTextField
      isInvalid={isInvalid ?? !!errorMessage}
      className={composeRenderProps(className, (resolved) =>
        ["flex flex-col", resolved].filter(Boolean).join(" "),
      )}
      {...props}
    >
      {label && (
        <Label className="block text-sm font-medium text-stone-700">
          {label}
        </Label>
      )}
      <Input
        placeholder={placeholder}
        className={inputClassName ?? defaultInput}
        {...inputProps}
      />
      {errorMessage && (
        <FieldError className="mt-2 text-sm text-red-600">
          {errorMessage}
        </FieldError>
      )}
    </AriaTextField>
  );
}
