import * as React from "react"

import { cn } from "../../lib/utils"

function FilterToolbar({ className, ...props }: React.ComponentProps<"form">) {
  return (
    <form
      data-slot="filter-toolbar"
      className={cn(
        "mb-4 grid grid-cols-[minmax(220px,1fr)_repeat(3,minmax(140px,auto))_auto_auto] items-end gap-3 rounded-4xl border border-surface-hover bg-surface p-4 max-lg:grid-cols-1",
        className
      )}
      {...props}
    />
  )
}

function FilterToolbarField({
  className,
  ...props
}: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="filter-toolbar-field"
      className={cn("grid gap-2", className)}
      {...props}
    />
  )
}

function FilterToolbarLabel({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="filter-toolbar-label"
      className={cn(
        "text-label-sm font-black text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

export { FilterToolbar, FilterToolbarField, FilterToolbarLabel }
