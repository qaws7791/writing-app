"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "#ui/lib/utils"

type TokenState =
  | "idle"
  | "selected"
  | "used"
  | "correct"
  | "incorrect"
  | "locked"

function TokenSentence({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="token-sentence"
      className={cn(
        "flex flex-wrap items-baseline gap-x-1 gap-y-3 text-base leading-9",
        className
      )}
      {...props}
    />
  )
}

const tokenSlotVariants = cva(
  "inline-flex min-h-9 min-w-10 items-center justify-center rounded-lg border-2 px-2.5 text-sm font-medium tracking-[-0.005em] transition-[background-color,border-color,color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25",
  {
    variants: {
      state: {
        empty:
          "border-dashed border-info/60 bg-info/8 text-info font-semibold hover:border-info/75 hover:bg-info/12",
        filled: "border-border/80 bg-card text-foreground shadow-xs",
        correct: "border-success/40 bg-success/10 text-success",
        incorrect: "border-destructive/40 bg-destructive/8 text-destructive",
        locked: "border-border/60 bg-muted/40 text-muted-foreground",
      },
    },
    defaultVariants: {
      state: "empty",
    },
  }
)

function TokenSlot({
  children,
  className,
  state = "empty",
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof tokenSlotVariants>) {
  return (
    <button
      type="button"
      data-slot="token-slot"
      data-state={state}
      className={cn(tokenSlotVariants({ state }), className)}
      {...props}
    >
      {children ?? (state === "empty" ? "?" : null)}
    </button>
  )
}

function TokenBank({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="token-bank"
      className={cn("flex flex-wrap items-center gap-2", className)}
      {...props}
    />
  )
}

const tokenVariants = cva(
  "inline-flex h-9 items-center justify-center rounded-lg border-2 px-3 text-sm font-medium tracking-[-0.005em] transition-[background-color,border-color,color,box-shadow,opacity] outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25 disabled:pointer-events-none",
  {
    variants: {
      state: {
        idle: "border-border/80 bg-card text-foreground shadow-xs hover:bg-accent/50",
        selected: "border-info/65 bg-info/12 text-info shadow-xs",
        used: "border-transparent bg-muted/50 text-muted-foreground opacity-45",
        correct: "border-success/30 bg-success/10 text-success",
        incorrect: "border-destructive/30 bg-destructive/6 text-destructive",
        locked:
          "pointer-events-none border-border/60 bg-muted/40 text-muted-foreground",
      },
    },
    defaultVariants: {
      state: "idle",
    },
  }
)

function Token({
  className,
  state = "idle",
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof tokenVariants> & {
    state?: TokenState
  }) {
  return (
    <button
      type="button"
      data-slot="token"
      data-state={state}
      disabled={state === "used" || state === "locked"}
      className={cn(tokenVariants({ state }), className)}
      {...props}
    />
  )
}

export {
  Token,
  TokenBank,
  TokenSentence,
  TokenSlot,
  tokenSlotVariants,
  tokenVariants,
}
export type { TokenState }
