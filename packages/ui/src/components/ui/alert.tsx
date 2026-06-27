import * as React from "react"

import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const alertVariants = cva(
  "grid gap-1.5 rounded-2xl border p-(--surface-padding-sm)",
  {
    variants: {
      tone: {
        neutral: "border-border-default bg-bg-elevated text-fg-default",
        success: "border-success-fg/20 bg-success-bg text-success-fg",
        danger: "border-danger-fg/20 bg-danger-bg text-danger-fg",
        info: "border-info-fg/20 bg-info-bg text-info-fg",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  }
)

function Alert({
  className,
  role = "status",
  tone = "neutral",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      role={role}
      data-slot="alert"
      data-tone={tone}
      className={cn(alertVariants({ tone, className }))}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn("font-bold", className)}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn("text-sm font-medium", className)}
      {...props}
    />
  )
}

export { Alert, AlertDescription, AlertTitle, alertVariants }
