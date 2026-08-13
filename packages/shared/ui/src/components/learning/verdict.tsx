"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "#ui/lib/utils"

type VerdictState = "idle" | "selected" | "correct" | "incorrect" | "locked"
type VerdictKind = "true" | "false"

function Verdict({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="radiogroup"
      data-slot="verdict"
      className={cn("grid w-full grid-cols-2 gap-3", className)}
      {...props}
    />
  )
}

function VerdictClaim({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="verdict-claim"
      className={cn(
        "font-heading text-xl font-medium leading-8 text-pretty text-foreground sm:text-[1.375rem]",
        className
      )}
      {...props}
    />
  )
}

const verdictOptionVariants = cva(
  "relative flex min-h-32 w-full items-center justify-center rounded-4xl border px-4 py-6 transition-[background-color,border-color,box-shadow,color,scale] duration-125 ease-press outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25 active:scale-98 disabled:pointer-events-none disabled:opacity-45",
  {
    variants: {
      state: {
        idle: "border-border/80 bg-card text-foreground shadow-xs hover:border-border hover:bg-accent/40",
        selected:
          "border-info/35 bg-info/10 text-foreground shadow-xs ring-1 ring-info/15",
        correct:
          "border-success/30 bg-success/10 text-success shadow-none dark:bg-success/12",
        incorrect:
          "border-destructive/30 bg-destructive/6 text-destructive shadow-none",
        locked:
          "border-border/60 bg-muted/40 text-muted-foreground shadow-none",
      },
    },
    defaultVariants: {
      state: "idle",
    },
  }
)

function VerdictOption({
  className,
  kind,
  selected = false,
  state = "idle",
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof verdictOptionVariants> & {
    kind: VerdictKind
    selected?: boolean
    state?: VerdictState
  }) {
  const resolvedState = state === "idle" && selected ? "selected" : state

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      data-slot="verdict-option"
      data-kind={kind}
      data-state={resolvedState}
      data-selected={selected || undefined}
      disabled={resolvedState === "locked"}
      className={cn(verdictOptionVariants({ state: resolvedState }), className)}
      {...props}
      aria-label={kind === "true" ? "참" : "거짓"}
    >
      <span aria-hidden data-slot="verdict-mark" data-kind={kind}>
        {kind === "true" ? <TrueMarkGlyph /> : <FalseMarkGlyph />}
      </span>
    </button>
  )
}

function TrueMarkGlyph() {
  return (
    <svg
      viewBox="0 0 48 48"
      className="size-12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="24" cy="24" r="15" stroke="currentColor" strokeWidth="3.5" />
    </svg>
  )
}

function FalseMarkGlyph() {
  return (
    <svg
      viewBox="0 0 48 48"
      className="size-12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M13 13 L35 35 M35 13 L13 35"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export { Verdict, VerdictClaim, VerdictOption, verdictOptionVariants }
export type { VerdictKind, VerdictState }
