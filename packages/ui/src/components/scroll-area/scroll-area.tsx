"use client"

import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"

export interface ScrollAreaProps extends React.ComponentProps<"div"> {
  orientation?: "vertical" | "horizontal" | "both"
}

function ScrollArea({
  className,
  orientation = "vertical",
  children,
  ...props
}: ScrollAreaProps) {
  return (
    <div
      data-slot="scroll-area"
      className={cn(
        "relative",
        orientation === "vertical" && "overflow-x-hidden overflow-y-auto",
        orientation === "horizontal" && "overflow-x-auto overflow-y-hidden",
        orientation === "both" && "overflow-auto",
        "[scrollbar-color:var(--on-surface-lowest)_transparent] [scrollbar-width:thin]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export { ScrollArea }
