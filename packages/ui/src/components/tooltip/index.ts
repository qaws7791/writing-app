import type { ComponentProps } from "react"

import {
  TooltipArrow,
  TooltipContent,
  TooltipRoot,
  TooltipTrigger,
} from "./tooltip"

export const Tooltip = Object.assign(TooltipRoot, {
  Root: TooltipRoot,
  Trigger: TooltipTrigger,
  Content: TooltipContent,
  Arrow: TooltipArrow,
})

export type Tooltip = {
  Props: ComponentProps<typeof TooltipRoot>
  RootProps: ComponentProps<typeof TooltipRoot>
  TriggerProps: ComponentProps<typeof TooltipTrigger>
  ContentProps: ComponentProps<typeof TooltipContent>
  ArrowProps: ComponentProps<typeof TooltipArrow>
}

export {
  TooltipRoot,
  TooltipTrigger,
  TooltipContent,
  TooltipArrow,
} from "./tooltip"
export type {
  TooltipRootProps,
  TooltipRootProps as TooltipProps,
  TooltipTriggerProps,
  TooltipContentProps,
  TooltipArrowProps,
} from "./tooltip"
export { tooltipVariants } from "./tooltip.styles"
export type { TooltipVariants } from "./tooltip.styles"
