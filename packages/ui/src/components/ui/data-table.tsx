import * as React from "react"

import { cn } from "../../lib/utils"

function DataTableContainer({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="data-table-container"
      className={cn("overflow-x-auto", className)}
      {...props}
    />
  )
}

function DataTable({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <table
      data-slot="data-table"
      className={cn(
        "w-full min-w-[47.5rem] border-collapse text-left text-fg-default [&_td]:border-b [&_td]:border-border-subtle [&_td]:px-3 [&_td]:py-3.5 [&_td]:text-body-sm [&_td]:font-semibold [&_td]:align-middle [&_th]:border-b [&_th]:border-border-subtle [&_th]:px-3 [&_th]:py-3.5 [&_th]:text-label-sm [&_th]:font-black [&_th]:text-fg-muted [&_th]:align-middle",
        className
      )}
      {...props}
    />
  )
}

export { DataTable, DataTableContainer }
