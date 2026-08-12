"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "#ui/lib/utils"

type ChoiceState =
  | "idle"
  | "selected"
  | "correct"
  | "incorrect"
  | "missed"
  | "locked"

function ChoiceGroup({
  className,
  type = "single",
  ...props
}: React.ComponentProps<"div"> & {
  type?: "single" | "multiple"
}) {
  return (
    <div
      role={type === "single" ? "radiogroup" : "group"}
      data-slot="choice-group"
      data-type={type}
      className={cn("flex w-full flex-col gap-3", className)}
      {...props}
    />
  )
}

const choiceVariants = cva(
  "relative flex w-full items-start rounded-3xl border px-4 py-3.5 text-left text-sm transition-[background-color,border-color,box-shadow,color] outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25 disabled:pointer-events-none disabled:opacity-45",
  {
    variants: {
      state: {
        idle: "border-border/80 bg-card text-foreground shadow-2xs hover:border-border hover:bg-accent/40",
        selected:
          "border-primary/35 bg-accent/55 text-foreground shadow-2xs ring-1 ring-primary/10",
        correct:
          "border-foreground/20 bg-foreground/[0.035] text-foreground shadow-none dark:bg-foreground/[0.06]",
        incorrect:
          "border-destructive/30 bg-destructive/6 text-destructive shadow-none",
        missed:
          "border-dashed border-border bg-transparent text-muted-foreground shadow-none",
        locked:
          "border-border/60 bg-muted/40 text-muted-foreground shadow-none",
      },
    },
    defaultVariants: {
      state: "idle",
    },
  }
)

function Choice({
  className,
  state = "idle",
  selected = false,
  disabled = false,
  mode = "single",
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof choiceVariants> & {
    state?: ChoiceState
    selected?: boolean
    mode?: "single" | "multiple"
  }) {
  const resolvedState = state === "idle" && selected ? "selected" : state

  return (
    <button
      type="button"
      role={mode === "single" ? "radio" : "checkbox"}
      aria-checked={selected}
      data-slot="choice"
      data-state={resolvedState}
      data-selected={selected || undefined}
      disabled={disabled || resolvedState === "locked"}
      className={cn(choiceVariants({ state: resolvedState }), className)}
      {...props}
    />
  )
}

function ChoiceContent({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="choice-content"
      className={cn("flex min-w-0 flex-1 flex-col gap-1", className)}
      {...props}
    />
  )
}

function ChoiceLabel({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="choice-label"
      className={cn(
        "text-sm leading-6 font-medium tracking-[-0.01em]",
        className
      )}
      {...props}
    />
  )
}

function ChoiceDescription({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="choice-description"
      className={cn("text-sm leading-6 text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Choice,
  ChoiceContent,
  ChoiceDescription,
  ChoiceGroup,
  ChoiceLabel,
  choiceVariants,
}
export type { ChoiceState }
