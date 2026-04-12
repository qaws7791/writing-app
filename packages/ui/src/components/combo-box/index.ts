import {
  ComboBoxRoot,
  ComboBoxInputGroup,
  ComboBoxTrigger,
  ComboBoxPopover,
} from "./combo-box"

export const ComboBox = Object.assign(ComboBoxRoot, {
  Root: ComboBoxRoot,
  InputGroup: ComboBoxInputGroup,
  Trigger: ComboBoxTrigger,
  Popover: ComboBoxPopover,
})

export { comboBoxVariants } from "./combo-box.styles"
export type { ComboBoxVariants } from "./combo-box.styles"
export type {
  ComboBoxRootProps,
  ComboBoxInputGroupProps,
  ComboBoxTriggerProps,
  ComboBoxPopoverProps,
} from "./combo-box"

export {
  ComboBoxRoot,
  ComboBoxInputGroup,
  ComboBoxTrigger,
  ComboBoxPopover,
  ComboBoxContext,
} from "./combo-box"
