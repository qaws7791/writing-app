import type { ComponentProps } from "react"

import { ErrorMessageRoot } from "./error-message"

export const ErrorMessage = Object.assign(ErrorMessageRoot, {
  Root: ErrorMessageRoot,
})

export type ErrorMessage = {
  Props: ComponentProps<typeof ErrorMessageRoot>
  RootProps: ComponentProps<typeof ErrorMessageRoot>
}

export { ErrorMessageRoot }
export type {
  ErrorMessageRootProps,
  ErrorMessageRootProps as ErrorMessageProps,
} from "./error-message"
export { errorMessageVariants } from "./error-message.styles"
export type { ErrorMessageVariants } from "./error-message.styles"
