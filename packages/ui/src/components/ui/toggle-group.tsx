import * as React from "react"
import { Toggle as TogglePrimitive } from "@base-ui/react/toggle"
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group"

import { cn } from "../../lib/utils"

function ToggleGroup({
  className,
  ...props
}: ToggleGroupPrimitive.Props<string>) {
  return (
    <ToggleGroupPrimitive
      data-slot="toggle-group"
      className={cn(
        "inline-flex items-center gap-1 rounded-control border border-border-subtle bg-bg-surface p-1 data-[orientation=vertical]:flex-col",
        className
      )}
      {...props}
    />
  )
}

function ToggleGroupItem({
  className,
  ...props
}: TogglePrimitive.Props<string>) {
  return (
    <TogglePrimitive
      data-slot="toggle-group-item"
      className={cn(
        "inline-flex h-(--control-height-sm) min-w-(--control-height-sm) items-center justify-center rounded-control px-3 text-sm font-bold text-fg-muted transition-colors outline-none hover:bg-bg-surface-hover hover:text-fg-default focus-visible:border-border-focus focus-visible:ring-3 focus-visible:ring-border-focus/20 disabled:pointer-events-none disabled:opacity-50 data-[pressed]:bg-action-selected-bg data-[pressed]:text-action-selected-fg",
        className
      )}
      {...props}
    />
  )
}

export { ToggleGroup, ToggleGroupItem }
