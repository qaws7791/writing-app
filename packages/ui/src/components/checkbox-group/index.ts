import type { ComponentProps } from "react"

import { CheckboxGroupRoot } from "./checkbox-group"

export const CheckboxGroup = Object.assign(CheckboxGroupRoot, {
  Root: CheckboxGroupRoot,
})

export type CheckboxGroup = {
  Props: ComponentProps<typeof CheckboxGroupRoot>
  RootProps: ComponentProps<typeof CheckboxGroupRoot>
}

export { CheckboxGroupRoot, CheckboxGroupContext } from "./checkbox-group"
export type {
  CheckboxGroupRootProps,
  CheckboxGroupRootProps as CheckboxGroupProps,
} from "./checkbox-group"
export { checkboxGroupVariants } from "./checkbox-group.styles"
export type { CheckboxGroupVariants } from "./checkbox-group.styles"
