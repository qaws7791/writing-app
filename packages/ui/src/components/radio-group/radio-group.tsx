"use client"

import type { ComponentPropsWithRef } from "react"

import { useMemo } from "react"
import { RadioGroup as RadioGroupPrimitive } from "react-aria-components"

import type { RadioGroupVariants } from "./radio-group.styles"

import { composeTwRenderProps } from "@workspace/ui/utils/compose"

import { radioGroupVariants } from "./radio-group.styles"

/* -------------------------------------------------------------------------------------------------
 * RadioGroup Root
 * -----------------------------------------------------------------------------------------------*/
interface RadioGroupRootProps
  extends
    ComponentPropsWithRef<typeof RadioGroupPrimitive>,
    RadioGroupVariants {}

const RadioGroupRoot = ({
  children,
  className,
  variant,
  ...props
}: RadioGroupRootProps) => {
  const styles = useMemo(() => radioGroupVariants({ variant }), [variant])

  return (
    <RadioGroupPrimitive
      data-slot="radio-group"
      {...props}
      className={composeTwRenderProps(className, styles)}
    >
      {(values) => (
        <>{typeof children === "function" ? children(values) : children}</>
      )}
    </RadioGroupPrimitive>
  )
}

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export { RadioGroupRoot }

export type { RadioGroupRootProps }
