import * as React from "react"

import { cn } from "../../lib/utils"

type SeparatorProps = React.ComponentProps<"div"> & {
  readonly decorative?: boolean
  readonly orientation?: "horizontal" | "vertical"
}

function Separator({
  className,
  decorative = true,
  orientation = "horizontal",
  ...props
}: SeparatorProps) {
  return (
    <div
      role={decorative ? "none" : "separator"}
      aria-orientation={decorative ? undefined : orientation}
      data-orientation={orientation}
      data-slot="separator"
      className={cn(
        "shrink-0 bg-border-default data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
        className
      )}
      {...props}
    />
  )
}

export { Separator }
