import type { ComponentProps } from "react"

import { LabelRoot } from "./label"

export const Label = Object.assign(LabelRoot, {
  Root: LabelRoot,
})

export type Label = {
  Props: ComponentProps<typeof LabelRoot>
  RootProps: ComponentProps<typeof LabelRoot>
}

export { LabelRoot }
export type { LabelRootProps, LabelProps } from "./label"
export { labelVariants } from "./label.styles"
export type { LabelVariants } from "./label.styles"
