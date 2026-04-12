import {
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectIndicator,
  SelectPopover,
} from "./select"

export const Select = Object.assign(SelectRoot, {
  Root: SelectRoot,
  Trigger: SelectTrigger,
  Value: SelectValue,
  Indicator: SelectIndicator,
  Popover: SelectPopover,
})

export { selectVariants } from "./select.styles"
export type { SelectVariants } from "./select.styles"
export type {
  SelectRootProps,
  SelectTriggerProps,
  SelectValueProps,
  SelectIndicatorProps,
  SelectPopoverProps,
} from "./select"

export {
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectIndicator,
  SelectPopover,
}
