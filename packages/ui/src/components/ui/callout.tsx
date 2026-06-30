import * as React from "react"

import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const calloutVariants = cva("grid gap-2 rounded-card border p-6", {
  variants: {
    tone: {
      neutral: "border-border-default bg-bg-surface text-fg-default",
      success: "border-success-fg/20 bg-success-bg text-success-fg",
      danger: "border-danger-fg/20 bg-danger-bg text-danger-fg",
      info: "border-info-fg/20 bg-info-bg text-info-fg",
    },
  },
  defaultVariants: {
    tone: "info",
  },
})

function Callout({
  className,
  tone = "info",
  ...props
}: React.ComponentProps<"aside"> & VariantProps<typeof calloutVariants>) {
  return (
    <aside
      data-slot="callout"
      data-tone={tone}
      className={cn(calloutVariants({ tone, className }))}
      {...props}
    />
  )
}

function CalloutTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="callout-title"
      className={cn("text-xl font-black", className)}
      {...props}
    />
  )
}

function CalloutContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="callout-content"
      className={cn("text-sm font-medium leading-6", className)}
      {...props}
    />
  )
}

export { Callout, CalloutContent, CalloutTitle, calloutVariants }
