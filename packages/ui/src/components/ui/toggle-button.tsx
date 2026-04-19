"use client"

import { Toggle as TogglePrimitive } from "@base-ui/react/toggle"

import { cn } from "../../lib/utils"

interface ToggleButtonProps extends Omit<
  TogglePrimitive.Props,
  "pressed" | "onPressedChange"
> {
  isSelected: boolean
  onChange: () => void
}

function ToggleButton({
  isSelected,
  onChange,
  className,
  children,
  ...props
}: ToggleButtonProps) {
  return (
    <TogglePrimitive
      data-slot="toggle-button"
      pressed={isSelected}
      onPressedChange={() => onChange()}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border border-border px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors outline-none select-none",
        "text-muted-foreground hover:text-foreground",
        "data-pressed:border-primary data-pressed:bg-primary data-pressed:text-primary-foreground",
        "focus-visible:ring-2 focus-visible:ring-ring/30",
        "disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </TogglePrimitive>
  )
}

export { ToggleButton }
