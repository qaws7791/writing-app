"use client"

import type { ComponentPropsWithRef } from "react"

import { Button as ButtonPrimitive } from "react-aria-components"

import type { ButtonVariants } from "./button.styles"

import { composeTwRenderProps } from "@workspace/ui/utils/compose"

import { buttonVariants } from "./button.styles"

interface ButtonRootProps
  extends ComponentPropsWithRef<typeof ButtonPrimitive>, ButtonVariants {}

const ButtonRoot = ({
  children,
  className,
  fullWidth,
  isIconOnly,
  size,
  variant,
  ...rest
}: ButtonRootProps) => {
  const styles = buttonVariants({
    fullWidth,
    isIconOnly,
    size,
    variant,
  })

  return (
    <ButtonPrimitive
      className={composeTwRenderProps(className, styles)}
      data-slot="button"
      {...rest}
    >
      {(renderProps) =>
        typeof children === "function" ? children(renderProps) : children
      }
    </ButtonPrimitive>
  )
}

export { ButtonRoot }
export type { ButtonRootProps, ButtonRootProps as ButtonProps }
