"use client"

import type { ComponentPropsWithRef } from "react"

import { ToggleButton as ToggleButtonPrimitive } from "react-aria-components"

import type { ToggleButtonVariants } from "./toggle-button.styles"

import { composeTwRenderProps } from "@workspace/ui/utils/compose"

import { toggleButtonVariants } from "./toggle-button.styles"

interface ToggleButtonRootProps
  extends
    ComponentPropsWithRef<typeof ToggleButtonPrimitive>,
    ToggleButtonVariants {}

const ToggleButtonRoot = ({
  children,
  className,
  isIconOnly,
  size,
  style,
  variant,
  ...rest
}: ToggleButtonRootProps) => {
  const styles = toggleButtonVariants({
    isIconOnly,
    size,
    variant,
  })

  return (
    <ToggleButtonPrimitive
      className={composeTwRenderProps(className, styles)}
      data-slot="toggle-button"
      style={style}
      {...rest}
    >
      {(renderProps) =>
        typeof children === "function" ? children(renderProps) : children
      }
    </ToggleButtonPrimitive>
  )
}

export { ToggleButtonRoot }
export type { ToggleButtonRootProps }
