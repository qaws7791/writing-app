"use client"

import type { ButtonVariants } from "@workspace/ui/components/button"
import type { ComponentPropsWithRef } from "react"

import React, {
  Children,
  createContext,
  isValidElement,
  useContext,
  useMemo,
} from "react"
import {
  Group,
  ToggleButtonGroupContext as RACToggleButtonGroupContext,
  useSlottedContext,
} from "react-aria-components"

import type { ButtonGroupVariants } from "./button-group.styles"

import {
  composeSlotClassName,
  composeTwRenderProps,
} from "@workspace/ui/utils/compose"

import { buttonGroupVariants } from "./button-group.styles"

/* -------------------------------------------------------------------------------------------------
 * ButtonGroup Context
 * -----------------------------------------------------------------------------------------------*/
type ButtonGroupContext = {
  slots?: ReturnType<typeof buttonGroupVariants>
  size?: ButtonVariants["size"]
  variant?: ButtonVariants["variant"]
  isDisabled?: boolean
  fullWidth?: ButtonVariants["fullWidth"]
}

const ButtonGroupContext = createContext<ButtonGroupContext>({})

export const BUTTON_GROUP_CHILD = "__button_group_child"

/* -------------------------------------------------------------------------------------------------
 * ButtonGroup Root
 * -----------------------------------------------------------------------------------------------*/
interface ButtonGroupRootProps
  extends
    ComponentPropsWithRef<typeof Group>,
    Pick<ButtonVariants, "size" | "variant">,
    ButtonGroupVariants {
  orientation?: "horizontal" | "vertical"
}

const ButtonGroupRoot = ({
  children,
  className,
  fullWidth,
  isDisabled,
  orientation: orientationProp,
  size,
  variant,
  ...rest
}: ButtonGroupRootProps) => {
  const racContext = useSlottedContext(RACToggleButtonGroupContext)
  const orientation = orientationProp ?? racContext?.orientation ?? "horizontal"

  const slots = useMemo(
    () => buttonGroupVariants({ fullWidth, orientation }),
    [fullWidth, orientation]
  )

  const wrappedChildren = Children.map(children as React.ReactNode, (child) => {
    if (!isValidElement(child)) {
      return child
    }

    return React.cloneElement(child, {
      [BUTTON_GROUP_CHILD]: true,
    } as Record<string, unknown>)
  })

  return (
    <ButtonGroupContext value={{ slots, size, variant, isDisabled, fullWidth }}>
      <Group
        className={composeTwRenderProps(className, slots.base())}
        data-slot="button-group"
        isDisabled={isDisabled}
        {...rest}
      >
        {wrappedChildren}
      </Group>
    </ButtonGroupContext>
  )
}

/* -------------------------------------------------------------------------------------------------
 * ButtonGroup Separator
 * -----------------------------------------------------------------------------------------------*/
interface ButtonGroupSeparatorProps extends ComponentPropsWithRef<"span"> {
  className?: string
}

const ButtonGroupSeparator = ({
  className,
  ...props
}: ButtonGroupSeparatorProps) => {
  const { slots } = useContext(ButtonGroupContext)

  return (
    <span
      aria-hidden="true"
      className={composeSlotClassName(slots?.separator, className)}
      data-slot="button-group-separator"
      {...props}
    />
  )
}

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export { ButtonGroupRoot, ButtonGroupSeparator, ButtonGroupContext }

export type { ButtonGroupRootProps, ButtonGroupSeparatorProps }
