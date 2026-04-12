import type { ComponentProps } from "react"

import { ButtonRoot } from "./button"

export const Button = Object.assign(ButtonRoot, {
  Root: ButtonRoot,
})

export type Button = {
  Props: ComponentProps<typeof ButtonRoot>
  RootProps: ComponentProps<typeof ButtonRoot>
}

export { ButtonRoot }
export type { ButtonRootProps, ButtonProps } from "./button"
export { buttonVariants } from "./button.styles"
export type { ButtonVariants } from "./button.styles"
