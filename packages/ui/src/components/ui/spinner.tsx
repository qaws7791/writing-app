import * as React from "react"

import { cn } from "../../lib/utils"

function Spinner({
  className,
  label,
  ...props
}: Omit<React.ComponentProps<"span">, "children"> & {
  readonly label?: string
}) {
  return (
    <span
      role={label === undefined ? undefined : "status"}
      aria-hidden={label === undefined ? true : undefined}
      aria-label={label}
      data-slot="spinner"
      className={cn(
        "inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent",
        className
      )}
      {...props}
    />
  )
}

export { Spinner }
