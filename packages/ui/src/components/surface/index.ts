import type { ComponentProps } from "react"

import { SurfaceRoot } from "./surface"

export const Surface = Object.assign(SurfaceRoot, {
  Root: SurfaceRoot,
})

export type Surface = {
  Props: ComponentProps<typeof SurfaceRoot>
  RootProps: ComponentProps<typeof SurfaceRoot>
}

export { SurfaceRoot } from "./surface"
export type {
  SurfaceRootProps,
  SurfaceRootProps as SurfaceProps,
} from "./surface"
export { SurfaceContext } from "./surface"
export { surfaceVariants } from "./surface.styles"
export type { SurfaceVariants } from "./surface.styles"
