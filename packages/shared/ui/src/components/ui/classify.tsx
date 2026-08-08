"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "#ui/lib/utils"

type ClassifyState =
  | "idle"
  | "active"
  | "placed"
  | "correct"
  | "incorrect"
  | "locked"

function Classify({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="classify"
      className={cn("flex w-full flex-col gap-6", className)}
      {...props}
    />
  )
}

function ClassifyCategories({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      role="toolbar"
      aria-label="카테고리"
      data-slot="classify-categories"
      className={cn("flex flex-wrap gap-2", className)}
      {...props}
    />
  )
}

const classifyCategoryVariants = cva(
  "inline-flex h-9 items-center justify-center rounded-full border px-3.5 text-sm font-medium tracking-[-0.005em] transition-[background-color,border-color,color,box-shadow] outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25 disabled:pointer-events-none disabled:opacity-45",
  {
    variants: {
      state: {
        idle: "border-border/80 bg-card text-foreground/85 shadow-2xs hover:bg-accent/50",
        active:
          "border-primary/35 bg-accent/60 text-foreground shadow-2xs ring-1 ring-primary/10",
        locked: "border-border/60 bg-muted/40 text-muted-foreground",
      },
    },
    defaultVariants: {
      state: "idle",
    },
  }
)

function ClassifyCategory({
  className,
  state = "idle",
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof classifyCategoryVariants> & {
    state?: "idle" | "active" | "locked"
  }) {
  return (
    <button
      type="button"
      data-slot="classify-category"
      data-state={state}
      disabled={state === "locked"}
      className={cn(classifyCategoryVariants({ state }), className)}
      {...props}
    />
  )
}

function ClassifyPool({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="classify-pool"
      className={cn("flex flex-col gap-2.5", className)}
      {...props}
    />
  )
}

const classifyItemVariants = cva(
  "group/classify-item flex w-full items-start gap-3 rounded-3xl border px-4 py-3.5 text-left text-sm transition-[background-color,border-color,box-shadow,color] outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25 disabled:pointer-events-none disabled:opacity-45",
  {
    variants: {
      state: {
        idle: "border-border/80 bg-card text-foreground shadow-2xs hover:bg-accent/40",
        active: "border-primary/35 bg-accent/55 text-foreground shadow-2xs",
        placed: "border-border bg-surface/80 text-foreground",
        correct: "border-foreground/20 bg-foreground/[0.035] text-foreground",
        incorrect: "border-destructive/30 bg-destructive/6 text-destructive",
        locked: "border-border/60 bg-muted/40 text-muted-foreground",
      },
    },
    defaultVariants: {
      state: "idle",
    },
  }
)

function ClassifyItem({
  className,
  state = "idle",
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof classifyItemVariants> & {
    state?: ClassifyState
  }) {
  return (
    <button
      type="button"
      data-slot="classify-item"
      data-state={state}
      disabled={state === "locked"}
      className={cn(classifyItemVariants({ state }), className)}
      {...props}
    />
  )
}

function ClassifyItemLabel({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="classify-item-label"
      className={cn(
        "min-w-0 flex-1 leading-6 font-medium tracking-[-0.01em]",
        className
      )}
      {...props}
    />
  )
}

function ClassifyItemTag({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="classify-item-tag"
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border border-border/70 bg-card px-2.5 py-0.5 text-xs font-medium text-muted-foreground group-data-[state=correct]/classify-item:border-foreground/20 group-data-[state=correct]/classify-item:text-foreground group-data-[state=incorrect]/classify-item:border-destructive/30 group-data-[state=incorrect]/classify-item:text-destructive",
        className
      )}
      {...props}
    />
  )
}

export {
  Classify,
  ClassifyCategories,
  ClassifyCategory,
  ClassifyItem,
  ClassifyItemLabel,
  ClassifyItemTag,
  ClassifyPool,
  classifyCategoryVariants,
  classifyItemVariants,
}
export type { ClassifyState }
