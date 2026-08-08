import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "#ui/lib/utils"

type MilestoneState = "reached" | "upcoming" | "locked"

function MilestoneList({ className, ...props }: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="milestone-list"
      className={cn("flex w-full flex-col gap-0", className)}
      {...props}
    />
  )
}

const milestoneVariants = cva(
  "grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 py-3 first:pt-0 last:pb-0",
  {
    variants: {
      state: {
        reached: "",
        upcoming: "",
        locked: "opacity-70",
      },
    },
    defaultVariants: {
      state: "reached",
    },
  }
)

const milestoneMarkVariants = cva(
  "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-medium tabular-nums",
  {
    variants: {
      state: {
        reached: "border-foreground/20 bg-foreground text-background",
        upcoming: "border-border bg-card text-foreground",
        locked: "border-border/70 bg-muted/50 text-muted-foreground",
      },
    },
    defaultVariants: {
      state: "reached",
    },
  }
)

function Milestone({
  className,
  state = "reached",
  ...props
}: React.ComponentProps<"li"> &
  VariantProps<typeof milestoneVariants> & {
    state?: MilestoneState
  }) {
  return (
    <li
      data-slot="milestone"
      data-state={state}
      className={cn(milestoneVariants({ state }), className)}
      {...props}
    />
  )
}

function MilestoneMark({
  className,
  state = "reached",
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof milestoneMarkVariants> & {
    state?: MilestoneState
  }) {
  return (
    <span
      data-slot="milestone-mark"
      data-state={state}
      className={cn(milestoneMarkVariants({ state }), className)}
      {...props}
    />
  )
}

function MilestoneBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="milestone-body"
      className={cn("flex min-w-0 flex-col gap-1", className)}
      {...props}
    />
  )
}

function MilestoneTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="milestone-title"
      className={cn("text-sm font-medium tracking-[-0.01em]", className)}
      {...props}
    />
  )
}

function MilestoneMeta({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="milestone-meta"
      className={cn("text-xs leading-5 text-muted-foreground", className)}
      {...props}
    />
  )
}

function MilestoneDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="milestone-description"
      className={cn(
        "text-sm leading-6 text-pretty text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  MilestoneList,
  Milestone,
  MilestoneMark,
  MilestoneBody,
  MilestoneTitle,
  MilestoneMeta,
  MilestoneDescription,
  milestoneVariants,
  milestoneMarkVariants,
  type MilestoneState,
}
