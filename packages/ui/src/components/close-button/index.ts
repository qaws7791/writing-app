import type { ComponentProps } from "react"

import { CloseButtonRoot } from "./close-button"

export const CloseButton = Object.assign(CloseButtonRoot, {
  Root: CloseButtonRoot,
})

export type CloseButton = {
  Props: ComponentProps<typeof CloseButtonRoot>
  RootProps: ComponentProps<typeof CloseButtonRoot>
}

export { CloseButtonRoot }
export type {
  CloseButtonRootProps,
  CloseButtonRootProps as CloseButtonProps,
} from "./close-button"
export { closeButtonVariants } from "./close-button.styles"
export type { CloseButtonVariants } from "./close-button.styles"
