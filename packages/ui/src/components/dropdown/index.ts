import {
  DropdownRoot,
  DropdownTrigger,
  DropdownPopover,
  DropdownMenu,
  DropdownItem,
  DropdownSection,
  DropdownItemIndicator,
  DropdownSubmenuIndicator,
  DropdownSubmenuTrigger,
} from "./dropdown"

export const Dropdown = Object.assign(DropdownRoot, {
  Root: DropdownRoot,
  Trigger: DropdownTrigger,
  Popover: DropdownPopover,
  Menu: DropdownMenu,
  Item: DropdownItem,
  Section: DropdownSection,
  ItemIndicator: DropdownItemIndicator,
  SubmenuIndicator: DropdownSubmenuIndicator,
  SubmenuTrigger: DropdownSubmenuTrigger,
})

export { dropdownVariants } from "./dropdown.styles"
export type { DropdownVariants } from "./dropdown.styles"
export type {
  DropdownRootProps,
  DropdownTriggerProps,
  DropdownPopoverProps,
  DropdownMenuProps,
  DropdownItemProps,
  DropdownSectionProps,
  DropdownItemIndicatorProps,
  DropdownSubmenuIndicatorProps,
  DropdownSubmenuTriggerProps,
} from "./dropdown"

export {
  DropdownRoot,
  DropdownTrigger,
  DropdownPopover,
  DropdownMenu,
  DropdownItem,
  DropdownSection,
  DropdownItemIndicator,
  DropdownSubmenuIndicator,
  DropdownSubmenuTrigger,
}
