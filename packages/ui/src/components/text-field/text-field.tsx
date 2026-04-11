"use client"

import * as React from "react"
import { Field } from "@base-ui/react/field"
import { Input } from "@base-ui/react/input"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@workspace/ui/lib/utils"

const textFieldVariants = cva(
  ["group/text-field relative flex w-full flex-col gap-1"],
  {
    variants: {
      variant: {
        filled: "",
        outlined: "",
      },
    },
    defaultVariants: {
      variant: "filled",
    },
  }
)

const inputWrapperVariants = cva(
  ["relative flex items-center gap-2 transition-colors"],
  {
    variants: {
      variant: {
        filled: [
          "rounded-t-md border-b-2 border-on-surface-low/40 bg-surface-container-highest/50 px-4",
          "focus-within:border-primary",
          "has-[[data-field=invalid]]:border-error",
        ],
        outlined: [
          "rounded-md border-2 border-outline px-4",
          "focus-within:border-primary",
          "has-[[data-field=invalid]]:border-error",
        ],
      },
    },
    defaultVariants: {
      variant: "filled",
    },
  }
)

export interface TextFieldProps
  extends
    Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof textFieldVariants> {
  label?: string
  helperText?: string
  errorText?: string
  leadingIcon?: React.ReactNode
  trailingIcon?: React.ReactNode
  showCount?: boolean
}

function TextField({
  variant,
  label,
  helperText,
  errorText,
  leadingIcon,
  trailingIcon,
  showCount,
  maxLength,
  className,
  ...props
}: TextFieldProps) {
  return (
    <Field.Root
      data-slot="text-field"
      className={cn(textFieldVariants({ variant }), className)}
      invalid={!!errorText}
    >
      {label && (
        <Field.Label className="text-label-medium text-on-surface-low">
          {label}
        </Field.Label>
      )}

      <div className={inputWrapperVariants({ variant })}>
        {leadingIcon && (
          <span className="size-5 text-on-surface-low">{leadingIcon}</span>
        )}
        <Input
          data-slot="text-field-input"
          className={cn(
            "w-full bg-transparent py-3 text-body-large text-on-surface outline-none",
            "placeholder:text-on-surface-lowest",
            "disabled:pointer-events-none disabled:opacity-38"
          )}
          maxLength={maxLength}
          {...props}
        />
        {trailingIcon && (
          <span className="size-5 text-on-surface-low">{trailingIcon}</span>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        {errorText ? (
          <Field.Error className="text-label-small text-error">
            {errorText}
          </Field.Error>
        ) : helperText ? (
          <Field.Description className="text-label-small text-on-surface-low">
            {helperText}
          </Field.Description>
        ) : (
          <span />
        )}
        {showCount && maxLength && (
          <span className="text-label-small text-on-surface-low">
            {String(props.value ?? "").length}/{maxLength}
          </span>
        )}
      </div>
    </Field.Root>
  )
}

export { TextField }
