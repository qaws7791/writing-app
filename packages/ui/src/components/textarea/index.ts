import type { ComponentProps } from "react"

import { TextAreaRoot } from "./textarea"

export const TextArea = Object.assign(TextAreaRoot, {
  Root: TextAreaRoot,
})

export type TextArea = {
  Props: ComponentProps<typeof TextAreaRoot>
  RootProps: ComponentProps<typeof TextAreaRoot>
}

export { TextAreaRoot }
export type {
  TextAreaRootProps,
  TextAreaRootProps as TextAreaProps,
} from "./textarea"
export { textAreaVariants } from "./textarea.styles"
export type { TextAreaVariants } from "./textarea.styles"
