import type { ComponentProps } from "react"

import { FieldErrorRoot } from "./field-error"

export const FieldError = Object.assign(FieldErrorRoot, {
  Root: FieldErrorRoot,
})

export type FieldError = {
  Props: ComponentProps<typeof FieldErrorRoot>
  RootProps: ComponentProps<typeof FieldErrorRoot>
}

export { FieldErrorRoot }
export type {
  FieldErrorRootProps,
  FieldErrorRootProps as FieldErrorProps,
} from "./field-error"
export { fieldErrorVariants } from "./field-error.styles"
export type { FieldErrorVariants } from "./field-error.styles"
