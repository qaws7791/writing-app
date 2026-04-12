import type { ComponentProps } from "react"

import { InputRoot } from "./input"

export const Input = Object.assign(InputRoot, {
  Root: InputRoot,
})

export type Input = {
  Props: ComponentProps<typeof InputRoot>
  RootProps: ComponentProps<typeof InputRoot>
}

export { InputRoot }
export type { InputRootProps, InputRootProps as InputProps } from "./input"
export { inputVariants } from "./input.styles"
export type { InputVariants } from "./input.styles"
