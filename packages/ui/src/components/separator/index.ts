import type { ComponentProps } from "react"

import { SeparatorRoot } from "./separator"

export const Separator = Object.assign(SeparatorRoot, {
  Root: SeparatorRoot,
})

export type Separator = {
  Props: ComponentProps<typeof SeparatorRoot>
  RootProps: ComponentProps<typeof SeparatorRoot>
}

export { SeparatorRoot }
export type {
  SeparatorRootProps,
  SeparatorRootProps as SeparatorProps,
} from "./separator"
export { separatorVariants } from "./separator.styles"
export type { SeparatorVariants } from "./separator.styles"
