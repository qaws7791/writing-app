import * as React from "react"

import { cn } from "../../lib/utils"

function Field({
  className,
  invalid,
  ...props
}: React.ComponentProps<"div"> & { readonly invalid?: boolean }) {
  return (
    <div
      data-invalid={invalid ? "" : undefined}
      data-slot="field"
      className={cn("grid gap-2", className)}
      {...props}
    />
  )
}

function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-group"
      className={cn("grid gap-4", className)}
      {...props}
    />
  )
}

function FieldLabel({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="field-label"
      className={cn("text-label-md font-bold text-fg-default", className)}
      {...props}
    />
  )
}

function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="field-description"
      className={cn("m-0 text-label-sm font-medium text-fg-muted", className)}
      {...props}
    />
  )
}

function FieldError({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      role="alert"
      data-slot="field-error"
      className={cn("m-0 text-label-sm font-bold text-danger-fg", className)}
      {...props}
    />
  )
}

function FormSection({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="form-section"
      className={cn("grid gap-5", className)}
      {...props}
    />
  )
}

export {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FormSection,
}
