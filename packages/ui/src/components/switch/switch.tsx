"use client"

import type { ComponentPropsWithRef } from "react"

import { createContext, useContext, useMemo } from "react"
import { Switch as SwitchPrimitive } from "react-aria-components"

import type { SwitchVariants } from "./switch.styles"

import {
  composeSlotClassName,
  composeTwRenderProps,
} from "@workspace/ui/utils/compose"

import { switchVariants } from "./switch.styles"

/* -------------------------------------------------------------------------------------------------
 * Switch Context
 * -----------------------------------------------------------------------------------------------*/
interface SwitchContext {
  slots?: ReturnType<typeof switchVariants>
}

const SwitchContext = createContext<SwitchContext>({})

/* -------------------------------------------------------------------------------------------------
 * Switch Root
 * -----------------------------------------------------------------------------------------------*/
interface SwitchRootProps
  extends ComponentPropsWithRef<typeof SwitchPrimitive>, SwitchVariants {}

const SwitchRoot = ({
  children,
  className,
  size,
  ...props
}: SwitchRootProps) => {
  const slots = useMemo(() => switchVariants({ size }), [size])

  return (
    <SwitchContext value={{ slots }}>
      <SwitchPrimitive
        data-slot="switch"
        {...props}
        className={composeTwRenderProps(className, slots.base())}
      >
        {(values) => (
          <>{typeof children === "function" ? children(values) : children}</>
        )}
      </SwitchPrimitive>
    </SwitchContext>
  )
}

/* -------------------------------------------------------------------------------------------------
 * Switch Control
 * -----------------------------------------------------------------------------------------------*/
type SwitchControlProps = ComponentPropsWithRef<"span">

const SwitchControl = ({
  children,
  className,
  ...props
}: SwitchControlProps) => {
  const { slots } = useContext(SwitchContext)

  return (
    <span
      className={composeSlotClassName(slots?.control, className)}
      data-slot="switch-control"
      {...props}
    >
      {children}
    </span>
  )
}

/* -------------------------------------------------------------------------------------------------
 * Switch Thumb
 * -----------------------------------------------------------------------------------------------*/
type SwitchThumbProps = ComponentPropsWithRef<"span">

const SwitchThumb = ({ children, className, ...props }: SwitchThumbProps) => {
  const { slots } = useContext(SwitchContext)

  return (
    <span
      className={composeSlotClassName(slots?.thumb, className)}
      data-slot="switch-thumb"
      {...props}
    >
      {children}
    </span>
  )
}

/* -------------------------------------------------------------------------------------------------
 * Switch Icon
 * -----------------------------------------------------------------------------------------------*/
type SwitchIconProps = ComponentPropsWithRef<"span">

const SwitchIcon = ({ children, className, ...props }: SwitchIconProps) => {
  const { slots } = useContext(SwitchContext)

  return (
    <span
      className={composeSlotClassName(slots?.icon, className)}
      data-slot="switch-icon"
      {...props}
    >
      {children}
    </span>
  )
}

/* -------------------------------------------------------------------------------------------------
 * Switch Content
 * -----------------------------------------------------------------------------------------------*/
type SwitchContentProps = ComponentPropsWithRef<"div">

const SwitchContent = ({
  children,
  className,
  ...props
}: SwitchContentProps) => {
  const { slots } = useContext(SwitchContext)

  return (
    <div
      className={composeSlotClassName(slots?.content, className)}
      data-slot="switch-content"
      {...props}
    >
      {children}
    </div>
  )
}

export { SwitchRoot, SwitchControl, SwitchThumb, SwitchIcon, SwitchContent }
export type {
  SwitchRootProps,
  SwitchControlProps,
  SwitchThumbProps,
  SwitchIconProps,
  SwitchContentProps,
}
