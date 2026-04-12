import type { ComponentProps } from "react"

import {
  ToggleButtonGroupRoot,
  ToggleButtonGroupSeparator,
} from "./toggle-button-group"

export const ToggleButtonGroup = Object.assign(ToggleButtonGroupRoot, {
  Root: ToggleButtonGroupRoot,
  Separator: ToggleButtonGroupSeparator,
})

export type ToggleButtonGroup = {
  Props: ComponentProps<typeof ToggleButtonGroupRoot>
  RootProps: ComponentProps<typeof ToggleButtonGroupRoot>
  SeparatorProps: ComponentProps<typeof ToggleButtonGroupSeparator>
}

export {
  ToggleButtonGroupRoot,
  ToggleButtonGroupSeparator,
  ToggleButtonGroupContext,
  TOGGLE_BUTTON_GROUP_CHILD,
} from "./toggle-button-group"
export type {
  ToggleButtonGroupRootProps,
  ToggleButtonGroupRootProps as ToggleButtonGroupProps,
  ToggleButtonGroupSeparatorProps,
} from "./toggle-button-group"
export { toggleButtonGroupVariants } from "./toggle-button-group.styles"
export type { ToggleButtonGroupVariants } from "./toggle-button-group.styles"
