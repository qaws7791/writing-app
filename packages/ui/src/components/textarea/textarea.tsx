"use client"

import type { ComponentPropsWithRef } from "react"

import { TextArea as TextAreaPrimitive } from "react-aria-components"

import type { TextAreaVariants } from "./textarea.styles"

import { composeTwRenderProps } from "@workspace/ui/utils/compose"

import { textAreaVariants } from "./textarea.styles"

interface TextAreaRootProps
  extends ComponentPropsWithRef<typeof TextAreaPrimitive>, TextAreaVariants {}

const TextAreaRoot = ({
  className,
  fullWidth,
  variant,
  ...rest
}: TextAreaRootProps) => {
  return (
    <TextAreaPrimitive
      data-slot="textarea"
      className={composeTwRenderProps(
        className,
        textAreaVariants({ fullWidth, variant })
      )}
      {...rest}
    />
  )
}

export { TextAreaRoot }
export type { TextAreaRootProps }
