import type { ComponentProps } from "react"

import { DescriptionRoot } from "./description"

export const Description = Object.assign(DescriptionRoot, {
  Root: DescriptionRoot,
})

export type Description = {
  Props: ComponentProps<typeof DescriptionRoot>
  RootProps: ComponentProps<typeof DescriptionRoot>
}

export { DescriptionRoot }
export type {
  DescriptionRootProps,
  DescriptionRootProps as DescriptionProps,
} from "./description"
export { descriptionVariants } from "./description.styles"
export type { DescriptionVariants } from "./description.styles"
