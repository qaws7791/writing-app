"use client"

import type { ComponentPropsWithRef } from "react"

import {
  SeparatorContext,
  Separator as SeparatorPrimitive,
  useSlottedContext,
} from "react-aria-components"

import type { SeparatorVariants } from "./separator.styles"

import { separatorVariants } from "./separator.styles"

interface SeparatorRootProps
  extends ComponentPropsWithRef<typeof SeparatorPrimitive>, SeparatorVariants {}

const SeparatorRoot = ({
  className,
  orientation,
  variant,
  ...props
}: SeparatorRootProps) => {
  const context = useSlottedContext(SeparatorContext)
  const resolvedOrientation =
    orientation ?? context?.orientation ?? "horizontal"

  return (
    <SeparatorPrimitive
      data-orientation={resolvedOrientation}
      data-slot="separator"
      orientation={resolvedOrientation}
      className={separatorVariants({
        orientation: resolvedOrientation,
        variant,
        className,
      })}
      {...props}
    />
  )
}

export { SeparatorRoot }
export type { SeparatorRootProps }
