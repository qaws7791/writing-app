import type { ComponentProps } from "react"

import { ChipLabel, ChipRoot } from "./chip"

export const Chip = Object.assign(ChipRoot, {
  Root: ChipRoot,
  Label: ChipLabel,
})

export type Chip = {
  Props: ComponentProps<typeof ChipRoot>
  RootProps: ComponentProps<typeof ChipRoot>
  LabelProps: ComponentProps<typeof ChipLabel>
}

export { ChipRoot, ChipLabel }
export type {
  ChipRootProps,
  ChipRootProps as ChipProps,
  ChipLabelProps,
} from "./chip"
export { chipVariants } from "./chip.styles"
export type { ChipVariants } from "./chip.styles"
