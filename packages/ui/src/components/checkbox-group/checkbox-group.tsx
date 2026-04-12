"use client"

import type { ComponentPropsWithRef } from "react"

import { createContext, useMemo } from "react"
import { CheckboxGroup as CheckboxGroupPrimitive } from "react-aria-components"

import type { CheckboxGroupVariants } from "./checkbox-group.styles"

import { composeTwRenderProps } from "@workspace/ui/utils/compose"

import { checkboxGroupVariants } from "./checkbox-group.styles"

/* -------------------------------------------------------------------------------------------------
 * CheckboxGroup Context
 * -----------------------------------------------------------------------------------------------*/
interface CheckboxGroupContext {
  variant?: "primary" | "secondary"
}

const CheckboxGroupContext = createContext<CheckboxGroupContext>({})

/* -------------------------------------------------------------------------------------------------
 * CheckboxGroup Root
 * -----------------------------------------------------------------------------------------------*/
interface CheckboxGroupRootProps
  extends
    ComponentPropsWithRef<typeof CheckboxGroupPrimitive>,
    CheckboxGroupVariants {}

const CheckboxGroupRoot = ({
  children,
  className,
  variant,
  ...props
}: CheckboxGroupRootProps) => {
  const styles = useMemo(() => checkboxGroupVariants({ variant }), [variant])

  return (
    <CheckboxGroupContext value={{ variant }}>
      <CheckboxGroupPrimitive
        className={composeTwRenderProps(className, styles)}
        data-slot="checkbox-group"
        {...props}
      >
        {(values) => (
          <>{typeof children === "function" ? children(values) : children}</>
        )}
      </CheckboxGroupPrimitive>
    </CheckboxGroupContext>
  )
}

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export { CheckboxGroupRoot, CheckboxGroupContext }

export type { CheckboxGroupRootProps }
