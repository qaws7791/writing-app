import type { ComponentProps } from "react"

import { TextFieldRoot } from "./text-field"

export const TextField = Object.assign(TextFieldRoot, {
  Root: TextFieldRoot,
})

export type TextField = {
  Props: ComponentProps<typeof TextFieldRoot>
  RootProps: ComponentProps<typeof TextFieldRoot>
}

export { TextFieldRoot, TextFieldContext } from "./text-field"
export type {
  TextFieldRootProps,
  TextFieldRootProps as TextFieldProps,
} from "./text-field"
export { textFieldVariants } from "./text-field.styles"
export type { TextFieldVariants } from "./text-field.styles"
