"use client"

import type { ComponentPropsWithRef } from "react"

import { useMemo } from "react"
import {
  SeparatorContext,
  ToggleButtonGroupContext,
  Toolbar as ToolbarPrimitive,
} from "react-aria-components"

import type { ToolbarVariants } from "./toolbar.styles"

import { composeTwRenderProps } from "@workspace/ui/utils/compose"

import { toolbarVariants } from "./toolbar.styles"

/* -------------------------------------------------------------------------------------------------
 * Toolbar Root
 * -----------------------------------------------------------------------------------------------*/
interface ToolbarRootProps
  extends ComponentPropsWithRef<typeof ToolbarPrimitive>, ToolbarVariants {}

const ToolbarRoot = ({
  children,
  className,
  isAttached,
  orientation = "horizontal",
  ...props
}: ToolbarRootProps) => {
  const styles = useMemo(
    () => toolbarVariants({ isAttached, orientation }),
    [isAttached, orientation]
  )

  return (
    <ToggleButtonGroupContext.Provider value={{ orientation }}>
      <SeparatorContext.Provider
        value={{
          orientation: orientation === "horizontal" ? "vertical" : "horizontal",
        }}
      >
        <ToolbarPrimitive
          className={composeTwRenderProps(className, styles)}
          data-slot="toolbar"
          orientation={orientation}
          {...props}
        >
          {children}
        </ToolbarPrimitive>
      </SeparatorContext.Provider>
    </ToggleButtonGroupContext.Provider>
  )
}

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export { ToolbarRoot }
export type { ToolbarRootProps }
