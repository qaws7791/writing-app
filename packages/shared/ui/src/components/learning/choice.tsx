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
  "relative flex w-full items-start rounded-3xl border-2 px-5 py-5 text-left text-base transition-[background-color,border-color,box-shadow,color,scale] duration-125 ease-press outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25 active:scale-98 disabled:pointer-events-none disabled:opacity-45",
  {
    variants: {
      state: {
        idle: "border-border/80 bg-card text-foreground shadow-xs hover:border-border hover:bg-accent/40",
        selected:
          "border-info/60 bg-info/10 text-foreground shadow-xs ring-1 ring-info/20",
        correct:
          "border-success/30 bg-success/10 text-success shadow-none dark:bg-success/12",
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
        "text-base leading-7 font-medium tracking-[-0.01em]",
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
