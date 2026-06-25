import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const choiceCardVariants = cva(
  "btn-squish flex w-full items-center gap-3 rounded-card border px-5 py-4 text-left text-body-md font-bold transition-colors outline-none focus-visible:border-border-focus focus-visible:ring-3 focus-visible:ring-border-focus/20 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      state: {
        correct: "border-success-fg/20 bg-success-bg text-success-fg",
        disabled: "border-border-subtle bg-bg-surface text-fg-disabled",
        idle: "border-border-subtle bg-bg-surface text-fg-default hover:bg-bg-surface-hover",
        selected:
          "border-action-selected-fg/25 bg-action-selected-bg text-action-selected-fg",
        wrong: "border-danger-fg/20 bg-danger-bg text-danger-fg",
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
