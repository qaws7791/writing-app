import * as React from "react"

import { cn } from "../../lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-(--control-height-md) w-full min-w-0 rounded-control border border-border-default bg-bg-surface px-4 py-2 text-base font-medium text-fg-default transition-[border-color,box-shadow,background-color] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-bold file:text-foreground placeholder:text-fg-subtle focus-visible:border-border-focus focus-visible:ring-3 focus-visible:ring-border-focus/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger-fg aria-invalid:ring-3 aria-invalid:ring-danger-fg/20 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
