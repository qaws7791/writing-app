import * as React from "react"

import { cn } from "../../lib/utils"

function Select({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="select"
      className={cn(
        "h-11 w-full min-w-0 rounded-3xl border border-charcoal/12 bg-cream px-4 py-2 text-base font-medium text-charcoal transition-[border-color,box-shadow,background-color] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-coral-dark aria-invalid:ring-3 aria-invalid:ring-coral/20 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Select }
