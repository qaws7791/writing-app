import type { ComponentProps } from "react"

import { RadioGroupRoot } from "./radio-group"

export const RadioGroup = Object.assign(RadioGroupRoot, {
  Root: RadioGroupRoot,
})

export type RadioGroup = {
  Props: ComponentProps<typeof RadioGroupRoot>
  RootProps: ComponentProps<typeof RadioGroupRoot>
}

export { RadioGroupRoot } from "./radio-group"
export type {
  RadioGroupRootProps,
  RadioGroupRootProps as RadioGroupProps,
} from "./radio-group"
export { radioGroupVariants } from "./radio-group.styles"
export type { RadioGroupVariants } from "./radio-group.styles"
