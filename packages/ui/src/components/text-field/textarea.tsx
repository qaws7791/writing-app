"use client"

import * as React from "react"
import { Field } from "@base-ui/react/field"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@workspace/ui/lib/utils"

const textareaWrapperVariants = cva(
  "relative flex items-start gap-2 transition-colors",
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

export interface TextareaProps
  extends
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaWrapperVariants> {
  label?: string
  helperText?: string
  errorText?: string
  showCount?: boolean
}

function Textarea({
  variant,
  label,
  helperText,
  errorText,
  showCount,
  maxLength,
  className,
  ...props
}: TextareaProps) {
  return (
    <Field.Root
      data-slot="textarea"
      className={cn("flex w-full flex-col gap-1", className)}
      invalid={!!errorText}
    >
      {label && (
        <Field.Label className="text-label-medium text-on-surface-low">
          {label}
        </Field.Label>
      )}

      <div className={textareaWrapperVariants({ variant })}>
        <Field.Control
          render={
            <textarea
              data-slot="textarea-input"
              className={cn(
                "w-full resize-y bg-transparent py-3 text-body-large text-on-surface outline-none",
                "placeholder:text-on-surface-lowest",
                "disabled:pointer-events-none disabled:opacity-38"
              )}
              maxLength={maxLength}
              rows={4}
              {...props}
            />
          }
        />
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

export { Textarea }
