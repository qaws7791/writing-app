import * as React from "react"

import { cn } from "../../lib/utils"

function Select({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="select"
      className={cn(
        "h-(--control-height-md) w-full min-w-0 rounded-control border border-border-default bg-bg-elevated px-4 py-2 text-base font-medium text-fg-default transition-[border-color,box-shadow,background-color] outline-none focus-visible:border-border-focus focus-visible:ring-3 focus-visible:ring-border-focus/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger-fg aria-invalid:ring-3 aria-invalid:ring-danger-fg/20 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Select }
