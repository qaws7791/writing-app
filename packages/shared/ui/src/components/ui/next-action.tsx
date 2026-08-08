import * as React from "react"

import { cn } from "#ui/lib/utils"

function NextAction({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="next-action"
      className={cn("flex w-full flex-col gap-4", className)}
      {...props}
    />
  )
}

function NextActionEyebrow({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="next-action-eyebrow"
      className={cn(
        "text-xs font-medium tracking-[0.04em] text-muted-foreground uppercase",
        className
      )}
      {...props}
    />
  )
}

function NextActionTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="next-action-title"
      className={cn(
        "text-lg font-semibold tracking-[-0.02em] text-balance sm:text-xl",
        className
      )}
      {...props}
    />
  )
}

function NextActionReason({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="next-action-reason"
      className={cn(
        "text-sm leading-6 text-pretty text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function NextActionMeta({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="next-action-meta"
      className={cn("text-xs tabular-nums text-muted-foreground", className)}
      {...props}
    />
  )
}

function NextActionBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="next-action-body"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function NextActionActions({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="next-action-actions"
      className={cn(
        "flex flex-col gap-2 sm:flex-row sm:items-center",
        className
      )}
      {...props}
    />
  )
}

export {
  NextAction,
  NextActionEyebrow,
  NextActionTitle,
  NextActionReason,
  NextActionMeta,
  NextActionBody,
  NextActionActions,
}
