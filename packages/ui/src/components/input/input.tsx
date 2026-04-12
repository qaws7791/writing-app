"use client"

import type { ComponentPropsWithRef } from "react"

import { Input as InputPrimitive } from "react-aria-components"

import type { InputVariants } from "./input.styles"

import { composeTwRenderProps } from "@workspace/ui/utils/compose"

import { inputVariants } from "./input.styles"

interface InputRootProps
  extends ComponentPropsWithRef<typeof InputPrimitive>, InputVariants {}

const InputRoot = ({
  className,
  fullWidth,
  variant,
  ...rest
}: InputRootProps) => {
  return (
    <InputPrimitive
      className={composeTwRenderProps(
        className,
        inputVariants({ fullWidth, variant })
      )}
      data-slot="input"
      {...rest}
    />
  )
}

export { InputRoot }
export type { InputRootProps }
