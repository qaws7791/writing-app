import type { ComponentProps } from "react"

import { SkeletonRoot } from "./skeleton"

export const Skeleton = Object.assign(SkeletonRoot, {
  Root: SkeletonRoot,
})

export type Skeleton = {
  Props: ComponentProps<typeof SkeletonRoot>
  RootProps: ComponentProps<typeof SkeletonRoot>
}

export { SkeletonRoot }
export type {
  SkeletonRootProps,
  SkeletonRootProps as SkeletonProps,
} from "./skeleton"
export { skeletonVariants } from "./skeleton.styles"
export type { SkeletonVariants } from "./skeleton.styles"
