import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { buttonVariants } from "#ui/components/ui/button"
import { cn } from "#ui/lib/utils"

const choiceCardVariants = cva(
  buttonVariants({
    className:
      "h-auto w-full justify-start gap-3 rounded-card px-5 py-4 text-left text-body-md",
    variant: "secondary",
  }),
  {
    variants: {
      state: {
        correct:
          "border-success-fg/20 bg-success text-success-foreground hover:bg-success",
        disabled:
          "bg-surface text-muted-foreground hover:bg-surface disabled:opacity-50",
        idle: "bg-surface text-foreground hover:bg-surface-hover",
        selected:
          "border-charcoal/20 bg-accent text-accent-foreground hover:bg-accent",
        wrong:
          "border-danger-fg/20 bg-danger text-danger-foreground hover:bg-danger",
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
