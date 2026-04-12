"use client"

import type { ComponentPropsWithRef } from "react"

import { useMemo } from "react"
import { Button as ButtonPrimitive } from "react-aria-components"

import type { CloseButtonVariants } from "./close-button.styles"

import { composeTwRenderProps } from "@workspace/ui/utils/compose"
import { CloseIcon } from "@workspace/ui/components/icons"

import { closeButtonVariants } from "./close-button.styles"

interface CloseButtonRootProps
  extends ComponentPropsWithRef<typeof ButtonPrimitive>, CloseButtonVariants {}

const CloseButtonRoot = ({
  children,
  className,
  slot,
  style,
  variant,
  ...rest
}: CloseButtonRootProps) => {
  const styles = useMemo(() => closeButtonVariants({ variant }), [variant])

  return (
    <ButtonPrimitive
      aria-label="Close"
      className={composeTwRenderProps(className, styles)}
      data-slot="close-button"
      slot={slot}
      style={style}
      {...rest}
    >
      {(renderProps) =>
        typeof children === "function"
          ? children(renderProps)
          : (children ?? <CloseIcon data-slot="close-button-icon" />)
      }
    </ButtonPrimitive>
  )
}

export { CloseButtonRoot }
export type { CloseButtonRootProps }
