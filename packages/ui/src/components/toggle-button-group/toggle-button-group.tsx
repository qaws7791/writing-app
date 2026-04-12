"use client"

import type { ToggleButtonVariants } from "@workspace/ui/components/toggle-button"
import type { ComponentPropsWithRef } from "react"

import { createContext, useContext, useMemo } from "react"
import {
  ToggleButtonGroupContext as RACToggleButtonGroupContext,
  ToggleButtonGroup as ToggleButtonGroupPrimitive,
  useSlottedContext,
} from "react-aria-components"

import type { ToggleButtonGroupVariants } from "./toggle-button-group.styles"

import {
  composeSlotClassName,
  composeTwRenderProps,
} from "@workspace/ui/utils/compose"

import { toggleButtonGroupVariants } from "./toggle-button-group.styles"

/* -------------------------------------------------------------------------------------------------
 * ToggleButtonGroup Context
 * -----------------------------------------------------------------------------------------------*/
type ToggleButtonGroupContext = {
  slots?: ReturnType<typeof toggleButtonGroupVariants>
  size?: ToggleButtonVariants["size"]
  isDisabled?: boolean
}

const ToggleButtonGroupContext = createContext<ToggleButtonGroupContext>({})

export const TOGGLE_BUTTON_GROUP_CHILD = "__toggle_button_group_child"

/* -------------------------------------------------------------------------------------------------
 * ToggleButtonGroup Root
 * -----------------------------------------------------------------------------------------------*/
interface ToggleButtonGroupRootProps
  extends
    ComponentPropsWithRef<typeof ToggleButtonGroupPrimitive>,
    ToggleButtonGroupVariants {
  size?: ToggleButtonVariants["size"]
  isDetached?: boolean
}

const ToggleButtonGroupRoot = ({
  children,
  className,
  fullWidth,
  isDetached = false,
  isDisabled,
  orientation: orientationProp,
  size,
  ...rest
}: ToggleButtonGroupRootProps) => {
  const racContext = useSlottedContext(RACToggleButtonGroupContext)
  const orientation = orientationProp ?? racContext?.orientation ?? "horizontal"

  const slots = useMemo(
    () => toggleButtonGroupVariants({ fullWidth, isDetached, orientation }),
    [fullWidth, isDetached, orientation]
  )

  return (
    <ToggleButtonGroupContext value={{ slots, size, isDisabled }}>
      <ToggleButtonGroupPrimitive
        className={composeTwRenderProps(className, slots.base())}
        data-slot="toggle-button-group"
        isDisabled={isDisabled}
        orientation={orientation}
        {...rest}
      >
        {children}
      </ToggleButtonGroupPrimitive>
    </ToggleButtonGroupContext>
  )
}

/* -------------------------------------------------------------------------------------------------
 * ToggleButtonGroup Separator
 * -----------------------------------------------------------------------------------------------*/
interface ToggleButtonGroupSeparatorProps extends ComponentPropsWithRef<"span"> {
  className?: string
}

const ToggleButtonGroupSeparator = ({
  className,
  ...props
}: ToggleButtonGroupSeparatorProps) => {
  const { slots } = useContext(ToggleButtonGroupContext)

  return (
    <span
      aria-hidden="true"
      className={composeSlotClassName(slots?.separator, className)}
      data-slot="toggle-button-group-separator"
      {...props}
    />
  )
}

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  ToggleButtonGroupRoot,
  ToggleButtonGroupSeparator,
  ToggleButtonGroupContext,
}

export type { ToggleButtonGroupRootProps, ToggleButtonGroupSeparatorProps }
