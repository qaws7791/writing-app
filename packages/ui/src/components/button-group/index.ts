import type { ComponentProps } from "react"

import { ButtonGroupRoot, ButtonGroupSeparator } from "./button-group"

export const ButtonGroup = Object.assign(ButtonGroupRoot, {
  Root: ButtonGroupRoot,
  Separator: ButtonGroupSeparator,
})

export type ButtonGroup = {
  Props: ComponentProps<typeof ButtonGroupRoot>
  RootProps: ComponentProps<typeof ButtonGroupRoot>
  SeparatorProps: ComponentProps<typeof ButtonGroupSeparator>
}

export {
  ButtonGroupRoot,
  ButtonGroupSeparator,
  ButtonGroupContext,
  BUTTON_GROUP_CHILD,
} from "./button-group"
export type {
  ButtonGroupRootProps,
  ButtonGroupRootProps as ButtonGroupProps,
  ButtonGroupSeparatorProps,
} from "./button-group"
export { buttonGroupVariants } from "./button-group.styles"
export type { ButtonGroupVariants } from "./button-group.styles"
