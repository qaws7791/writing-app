"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "#ui/lib/utils"

type SegmentState =
  | "idle"
  | "selected"
  | "correct"
  | "incorrect"
  | "missed"
  | "locked"

function SegmentGroup({
  className,
  layout = "inline",
  ...props
}: React.ComponentProps<"div"> & {
  layout?: "inline" | "block"
}) {
  return (
    <div
      role="group"
      data-slot="segment-group"
      data-layout={layout}
      className={cn(
        "w-full text-base leading-8 tracking-[-0.01em]",
        layout === "inline" &&
          "flex flex-wrap items-baseline gap-x-1 gap-y-1.5",
        layout === "block" && "flex flex-col gap-3",
        className
      )}
      {...props}
    />
  )
}

const segmentVariants = cva(
  "transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out outline-none select-none active:scale-[0.98] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25 disabled:pointer-events-none disabled:opacity-45",
  {
    variants: {
      layout: {
        inline: "inline rounded-lg border px-1.5 py-0.5 text-left font-normal",
        block:
          "flex w-full rounded-3xl border px-4 py-3.5 text-left text-sm leading-6 font-normal",
      },
      state: {
        idle: "border-border/70 bg-card text-foreground shadow-2xs hover:border-border hover:bg-accent/50",
        selected:
          "border-info/45 bg-info/15 text-foreground font-medium shadow-xs ring-1 ring-info/30 hover:border-info/55 hover:bg-info/20",
        correct:
          "border-success/35 bg-success/12 text-success font-medium shadow-none hover:bg-success/16",
        incorrect:
          "border-destructive/35 bg-destructive/8 text-destructive font-medium shadow-none hover:bg-destructive/12",
        missed:
          "border-dashed border-border/80 bg-transparent text-muted-foreground shadow-none",
        locked:
          "border-border/60 bg-muted/40 text-muted-foreground shadow-none",
      },
      intent: {
        choice: "",
        fault: "",
      },
    },
    compoundVariants: [
      { layout: "inline", state: "idle", class: "text-foreground" },
      {
        layout: "inline",
        state: "selected",
        class: "border-info/40",
      },
      {
        intent: "fault",
        state: "selected",
        class:
          "border-warning/45 bg-warning/15 text-foreground font-medium shadow-xs ring-1 ring-warning/30 hover:border-warning/55 hover:bg-warning/20",
      },
      {
        layout: "inline",
        intent: "fault",
        state: "selected",
        class: "border-warning/40",
      },
      {
        layout: "inline",
        state: "correct",
        class: "border-success/30",
      },
      {
        layout: "inline",
        state: "incorrect",
        class: "border-destructive/30",
      },
    ],
    defaultVariants: {
      layout: "inline",
      state: "idle",
      intent: "choice",
    },
  }
)

function Segment({
  className,
  intent = "choice",
  layout = "inline",
  state = "idle",
  selected = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof segmentVariants> & {
    intent?: "choice" | "fault"
    state?: SegmentState
    selected?: boolean
  }) {
  const resolvedState = state === "idle" && selected ? "selected" : state

  return (
    <button
      type="button"
      aria-pressed={
        selected || resolvedState === "correct" || resolvedState === "incorrect"
      }
      data-slot="segment"
      data-intent={intent}
      data-layout={layout}
      data-state={resolvedState}
      data-selected={selected || undefined}
      disabled={resolvedState === "locked"}
      className={cn(
        segmentVariants({ intent, layout, state: resolvedState }),
        className
      )}
      {...props}
    />
  )
}

export { Segment, SegmentGroup, segmentVariants }
export type { SegmentState }
