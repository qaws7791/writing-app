"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import {
  learningSeriesActiveClass,
  learningSeriesDotClass,
  learningSeriesSurfaceClass,
  type LearningSeries,
} from "#ui/lib/learning-series"
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
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-full border px-3.5 text-sm font-medium tracking-[-0.005em] transition-[background-color,border-color,color,box-shadow] outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25 disabled:pointer-events-none disabled:opacity-45",
  {
    variants: {
      state: {
        idle: "border-border/80 bg-card text-foreground/85 shadow-xs hover:bg-accent/50",
        active:
          "border-info/35 bg-info/10 text-foreground shadow-xs ring-1 ring-info/15",
        locked: "border-border/60 bg-muted/40 text-muted-foreground",
        series: "shadow-xs",
      },
    },
    defaultVariants: {
      state: "idle",
    },
  }
)

function ClassifySeriesDot({
  className,
  series,
}: {
  className?: string
  series: LearningSeries
}) {
  return (
    <span
      aria-hidden
      data-slot="classify-series-dot"
      className={cn(
        "size-1.5 shrink-0 rounded-full",
        learningSeriesDotClass[series],
        className
      )}
    />
  )
}

function ClassifyCategory({
  className,
  series,
  state = "idle",
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof classifyCategoryVariants> & {
    series?: LearningSeries
    state?: "idle" | "active" | "locked"
  }) {
  const toneState =
    series !== undefined && state !== "locked" ? "series" : state

  return (
    <button
      type="button"
      data-slot="classify-category"
      data-series={series}
      data-state={state}
      disabled={state === "locked"}
      className={cn(
        classifyCategoryVariants({ state: toneState }),
        series && state === "idle" && learningSeriesSurfaceClass[series],
        series && state === "active" && learningSeriesActiveClass[series],
        className
      )}
      {...props}
    >
      {series === undefined ? null : <ClassifySeriesDot series={series} />}
      {children}
    </button>
  )
}

function ClassifyPool({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="classify-pool"
      className={cn("flex flex-col gap-3", className)}
      {...props}
    />
  )
}

const classifyItemVariants = cva(
  "group/classify-item flex w-full items-start gap-3 rounded-3xl border px-4 py-3.5 text-left text-sm transition-[background-color,border-color,box-shadow,color] outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25 disabled:pointer-events-none disabled:opacity-45",
  {
    variants: {
      state: {
        idle: "border-border/80 bg-card text-foreground shadow-xs hover:bg-accent/40",
        active: "border-info/35 bg-info/10 text-foreground shadow-xs",
        placed: "border-border bg-surface/80 text-foreground shadow-xs",
        correct: "border-success/30 bg-success/10 text-success",
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
  series,
  children,
  ...props
}: React.ComponentProps<"span"> & {
  series?: LearningSeries
}) {
  return (
    <span
      data-slot="classify-item-tag"
      data-series={series}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        series
          ? learningSeriesSurfaceClass[series]
          : "border-border/70 bg-card text-muted-foreground",
        className
      )}
      {...props}
    >
      {series === undefined ? null : <ClassifySeriesDot series={series} />}
      {children}
    </span>
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
