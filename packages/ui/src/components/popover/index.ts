import type { ComponentProps } from "react"

import {
  PopoverArrow,
  PopoverContent,
  PopoverDialog,
  PopoverHeading,
  PopoverRoot,
  PopoverTrigger,
} from "./popover"

export const Popover = Object.assign(PopoverRoot, {
  Root: PopoverRoot,
  Trigger: PopoverTrigger,
  Content: PopoverContent,
  Arrow: PopoverArrow,
  Dialog: PopoverDialog,
  Heading: PopoverHeading,
})

export type Popover = {
  Props: ComponentProps<typeof PopoverRoot>
  RootProps: ComponentProps<typeof PopoverRoot>
  TriggerProps: ComponentProps<typeof PopoverTrigger>
  ContentProps: ComponentProps<typeof PopoverContent>
  ArrowProps: ComponentProps<typeof PopoverArrow>
  DialogProps: ComponentProps<typeof PopoverDialog>
  HeadingProps: ComponentProps<typeof PopoverHeading>
}

export {
  PopoverRoot,
  PopoverTrigger,
  PopoverDialog,
  PopoverArrow,
  PopoverContent,
  PopoverHeading,
} from "./popover"
export type {
  PopoverRootProps,
  PopoverRootProps as PopoverProps,
  PopoverTriggerProps,
  PopoverDialogProps,
  PopoverArrowProps,
  PopoverContentProps,
  PopoverHeadingProps,
} from "./popover"
export { popoverVariants } from "./popover.styles"
export type { PopoverVariants } from "./popover.styles"
