"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/registry/luma/lib/utils";

type SegmentState = "idle" | "selected" | "correct" | "incorrect" | "missed" | "locked";

function SegmentGroup({
  className,
  layout = "inline",
  ...props
}: React.ComponentProps<"div"> & {
  layout?: "inline" | "block";
}) {
  return (
    <div
      role="group"
      data-slot="segment-group"
      data-layout={layout}
      className={cn(
        "w-full text-base leading-8 tracking-[-0.01em]",
        layout === "inline" && "flex flex-wrap items-baseline gap-x-1 gap-y-1.5",
        layout === "block" && "flex flex-col gap-2.5",
        className,
      )}
      {...props}
    />
  );
}

const segmentVariants = cva(
  "transition-[background-color,border-color,color,box-shadow] outline-none focus-visible:ring-3 focus-visible:ring-ring/25 disabled:pointer-events-none disabled:opacity-45",
  {
    variants: {
      layout: {
        inline:
          "inline rounded-lg border border-transparent px-1.5 py-0.5 text-left hover:bg-accent/55 focus-visible:border-ring",
        block:
          "flex w-full rounded-3xl border border-border/80 bg-card px-4 py-3.5 text-left text-sm leading-6 shadow-2xs hover:bg-accent/40 focus-visible:border-ring",
      },
      state: {
        idle: "",
        selected: "border-primary/35 bg-accent/55 shadow-2xs",
        correct: "border-foreground/20 bg-foreground/[0.035]",
        incorrect: "border-destructive/30 bg-destructive/6 text-destructive",
        missed: "border-dashed border-border/80 bg-transparent text-muted-foreground",
        locked: "border-border/60 bg-muted/40 text-muted-foreground",
      },
    },
    compoundVariants: [
      {
        layout: "inline",
        state: "idle",
        class: "text-foreground",
      },
      {
        layout: "inline",
        state: "selected",
        class: "border-primary/30",
      },
      {
        layout: "inline",
        state: "correct",
        class: "border-foreground/15",
      },
      {
        layout: "inline",
        state: "incorrect",
        class: "border-destructive/25",
      },
    ],
    defaultVariants: {
      layout: "inline",
      state: "idle",
    },
  },
);

function Segment({
  className,
  layout = "inline",
  state = "idle",
  selected = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof segmentVariants> & {
    state?: SegmentState;
    selected?: boolean;
  }) {
  const resolvedState = state === "idle" && selected ? "selected" : state;

  return (
    <button
      type="button"
      aria-pressed={selected || resolvedState === "correct" || resolvedState === "incorrect"}
      data-slot="segment"
      data-layout={layout}
      data-state={resolvedState}
      data-selected={selected || undefined}
      disabled={resolvedState === "locked"}
      className={cn(segmentVariants({ layout, state: resolvedState }), className)}
      {...props}
    />
  );
}

export { Segment, SegmentGroup, segmentVariants };
export type { SegmentState };
