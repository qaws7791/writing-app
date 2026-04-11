"use client"

import * as React from "react"
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"
import { cn } from "@workspace/ui/lib/utils"

export interface TooltipProps {
  content: React.ReactNode
  children: React.ReactElement
  side?: "top" | "bottom" | "left" | "right"
  sideOffset?: number
  delay?: number
  className?: string
}

function Tooltip({
  content,
  children,
  side = "top",
  sideOffset = 4,
  delay = 300,
  className,
}: TooltipProps) {
  return (
    <TooltipPrimitive.Provider delay={delay}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger render={children} />
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Positioner side={side} sideOffset={sideOffset}>
            <TooltipPrimitive.Popup
              data-slot="tooltip"
              className={cn(
                "z-80 max-w-[200px] rounded px-2 py-1.5",
                "bg-inverse-surface text-inverse-on-surface",
                "text-body-small",
                "animate-in fade-in-0 zoom-in-95",
                "data-[ending-style]:animate-out data-[ending-style]:fade-out-0 data-[ending-style]:zoom-out-95",
                className
              )}
            >
              {content}
            </TooltipPrimitive.Popup>
          </TooltipPrimitive.Positioner>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}

export { Tooltip }
