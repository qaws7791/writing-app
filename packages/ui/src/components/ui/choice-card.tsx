import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "#ui/lib/utils"

const choiceCardVariants = cva(
  "btn-squish flex w-full items-center gap-3 rounded-card border px-5 py-4 text-left text-body-md font-bold transition-colors outline-none focus-visible:border-focus focus-visible:ring-3 focus-visible:ring-focus/20 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      state: {
        correct: "border-success-fg/20 bg-success text-success-foreground",
        disabled: "bg-surface text-muted-foreground",
        idle: "bg-surface text-foreground hover:bg-surface-hover",
        selected: "border-charcoal/20 bg-accent text-accent-foreground",
        wrong: "border-danger-fg/20 bg-danger text-danger-foreground",
      },
    },
    defaultVariants: {
      state: "idle",
    },
  }
)

function ChoiceCardGroup({
  className,
  role = "group",
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="choice-card-group"
      role={role}
      className={cn("grid gap-3", className)}
      {...props}
    />
  )
}

function ChoiceCard({
  className,
  disabled,
  state = "idle",
  type = "button",
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof choiceCardVariants>) {
  const resolvedState = disabled ? "disabled" : state

  return (
    <button
      data-slot="choice-card"
      data-state={resolvedState}
      className={cn(choiceCardVariants({ state: resolvedState, className }))}
      disabled={disabled}
      type={type}
      {...props}
    />
  )
}

export { ChoiceCard, ChoiceCardGroup, choiceCardVariants }
