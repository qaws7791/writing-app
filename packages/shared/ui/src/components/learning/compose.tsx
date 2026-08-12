"use client"

import * as React from "react"

import { Textarea } from "#ui/components/primitives/textarea"
import { cn } from "#ui/lib/utils"

function Compose({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="compose"
      className={cn("flex w-full flex-col gap-5", className)}
      {...props}
    />
  )
}

function ComposeBadge({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="compose-badge"
      className={cn(
        "inline-flex w-fit items-center rounded-full border border-border/80 bg-card px-2.5 py-1 text-xs font-medium tracking-[0.02em] text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function ComposeClaim({
  className,
  ...props
}: React.ComponentProps<"blockquote">) {
  return (
    <blockquote
      data-slot="compose-claim"
      className={cn(
        "rounded-3xl border border-border/70 bg-surface/70 px-5 py-4 text-sm leading-6 text-pretty text-foreground/90",
        className
      )}
      {...props}
    />
  )
}

function ComposeContext({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="compose-context"
      className={cn(
        "text-sm leading-6 text-pretty text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function ComposeSource({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="compose-source"
      className={cn(
        "rounded-3xl border border-border/70 bg-card px-5 py-4 text-sm leading-6 text-pretty shadow-2xs",
        className
      )}
      {...props}
    />
  )
}

function ComposeGuide({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="compose-guide"
      className={cn(
        "rounded-3xl border border-dashed border-border/80 bg-transparent px-5 py-4 text-sm leading-6 text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function ComposeEditor({
  className,
  ...props
}: React.ComponentProps<typeof Textarea>) {
  return (
    <Textarea
      data-slot="compose-editor"
      className={cn(
        "min-h-40 rounded-3xl text-base leading-7 md:text-base",
        className
      )}
      {...props}
    />
  )
}

function ComposeMeter({
  className,
  value = 0,
  min,
  goal,
  max,
  ...props
}: React.ComponentProps<"div"> & {
  value?: number
  min?: number
  goal?: number
  max?: number
}) {
  const meetsMin = min === undefined || value >= min
  const overMax = max !== undefined && value > max

  return (
    <div
      data-slot="compose-meter"
      data-state={overMax ? "over" : meetsMin ? "ready" : "short"}
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-1 text-xs tabular-nums text-muted-foreground",
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "font-medium",
          overMax && "text-destructive",
          meetsMin && !overMax && "text-foreground/80"
        )}
      >
        {value.toLocaleString("ko-KR")}자
      </span>
      {min !== undefined && <span>최소 {min.toLocaleString("ko-KR")}</span>}
      {goal !== undefined && <span>목표 {goal.toLocaleString("ko-KR")}</span>}
      {max !== undefined && <span>최대 {max.toLocaleString("ko-KR")}</span>}
    </div>
  )
}

function ComposeReference({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="compose-reference"
      className={cn(
        "rounded-3xl border border-border/70 bg-surface/60 px-5 py-4 text-sm leading-6 text-pretty",
        className
      )}
      {...props}
    />
  )
}

function ComposeActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="compose-actions"
      className={cn("flex flex-wrap items-center gap-2", className)}
      {...props}
    />
  )
}

export {
  Compose,
  ComposeActions,
  ComposeBadge,
  ComposeClaim,
  ComposeContext,
  ComposeEditor,
  ComposeGuide,
  ComposeMeter,
  ComposeReference,
  ComposeSource,
}
