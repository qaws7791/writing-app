import type { ComponentProps } from "react"

import { ScrollShadowRoot } from "./scroll-shadow"

export const ScrollShadow = Object.assign(ScrollShadowRoot, {
  Root: ScrollShadowRoot,
})

export type ScrollShadow = {
  Props: ComponentProps<typeof ScrollShadowRoot>
  RootProps: ComponentProps<typeof ScrollShadowRoot>
}

export { ScrollShadowRoot }
export type {
  ScrollShadowRootProps,
  ScrollShadowRootProps as ScrollShadowProps,
  ScrollShadowVisibility,
} from "./scroll-shadow"
export { scrollShadowVariants } from "./scroll-shadow.styles"
export type { ScrollShadowVariants } from "./scroll-shadow.styles"
export { useScrollShadow } from "./use-scroll-shadow"
export type { UseScrollShadowProps } from "./use-scroll-shadow"
