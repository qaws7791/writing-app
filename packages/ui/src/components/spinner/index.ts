import type { ComponentProps } from "react"

import { SpinnerRoot } from "./spinner"

export const Spinner = Object.assign(SpinnerRoot, {
  Root: SpinnerRoot,
})

export type Spinner = {
  Props: ComponentProps<typeof SpinnerRoot>
  RootProps: ComponentProps<typeof SpinnerRoot>
}

export { SpinnerRoot }
export type {
  SpinnerRootProps,
  SpinnerRootProps as SpinnerProps,
} from "./spinner"
export { spinnerVariants } from "./spinner.styles"
export type { SpinnerVariants } from "./spinner.styles"
