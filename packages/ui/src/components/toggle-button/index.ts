import type { ComponentProps } from "react"

import { ToggleButtonRoot } from "./toggle-button"

export const ToggleButton = Object.assign(ToggleButtonRoot, {
  Root: ToggleButtonRoot,
})

export type ToggleButton = {
  Props: ComponentProps<typeof ToggleButtonRoot>
  RootProps: ComponentProps<typeof ToggleButtonRoot>
}

export { ToggleButtonRoot }
export type {
  ToggleButtonRootProps,
  ToggleButtonRootProps as ToggleButtonProps,
} from "./toggle-button"
export { toggleButtonVariants } from "./toggle-button.styles"
export type { ToggleButtonVariants } from "./toggle-button.styles"
