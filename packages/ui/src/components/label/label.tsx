"use client"

import type { ComponentPropsWithRef } from "react"

import { Label as LabelPrimitive } from "react-aria-components"

import type { LabelVariants } from "./label.styles"

import { labelVariants } from "./label.styles"

interface LabelRootProps
  extends ComponentPropsWithRef<typeof LabelPrimitive>, LabelVariants {}

const LabelRoot = ({
  children,
  className,
  isDisabled,
  isInvalid,
  isRequired,
  ...rest
}: LabelRootProps) => {
  return (
    <LabelPrimitive
      className={labelVariants({
        className,
        isDisabled,
        isInvalid,
        isRequired,
      })}
      data-slot="label"
      {...rest}
    >
      {children}
    </LabelPrimitive>
  )
}

export { LabelRoot }
export type { LabelRootProps, LabelRootProps as LabelProps }
