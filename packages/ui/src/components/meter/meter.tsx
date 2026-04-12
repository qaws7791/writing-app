"use client"

import type { ComponentPropsWithRef } from "react"
import type { MeterRenderProps } from "react-aria-components"

import { createContext, useContext, useMemo } from "react"
import { Meter as MeterPrimitive } from "react-aria-components"

import type { MeterVariants } from "./meter.styles"

import {
  composeSlotClassName,
  composeTwRenderProps,
} from "@workspace/ui/utils/compose"

import { meterVariants } from "./meter.styles"

/* -------------------------------------------------------------------------------------------------
 * Meter Context
 * -----------------------------------------------------------------------------------------------*/
interface MeterContext {
  slots?: ReturnType<typeof meterVariants>
  state?: MeterRenderProps
}

const MeterContext = createContext<MeterContext>({})

/* -------------------------------------------------------------------------------------------------
 * Meter Root
 * -----------------------------------------------------------------------------------------------*/
interface MeterRootProps
  extends ComponentPropsWithRef<typeof MeterPrimitive>, MeterVariants {}

const MeterRoot = ({
  children,
  className,
  color,
  size,
  ...props
}: MeterRootProps) => {
  const slots = useMemo(() => meterVariants({ color, size }), [color, size])

  return (
    <MeterPrimitive
      data-slot="meter"
      {...props}
      className={composeTwRenderProps(className, slots.base())}
    >
      {(values) => (
        <MeterContext value={{ slots, state: values }}>
          {typeof children === "function" ? children(values) : children}
        </MeterContext>
      )}
    </MeterPrimitive>
  )
}

/* -------------------------------------------------------------------------------------------------
 * Meter Output
 * -----------------------------------------------------------------------------------------------*/
type MeterOutputProps = ComponentPropsWithRef<"span">

const MeterOutput = ({ children, className, ...props }: MeterOutputProps) => {
  const { slots, state } = useContext(MeterContext)

  return (
    <span
      className={composeSlotClassName(slots?.output, className)}
      data-slot="meter-output"
      {...props}
    >
      {children ?? state?.valueText}
    </span>
  )
}

/* -------------------------------------------------------------------------------------------------
 * Meter Track
 * -----------------------------------------------------------------------------------------------*/
type MeterTrackProps = ComponentPropsWithRef<"div">

const MeterTrack = ({ children, className, ...props }: MeterTrackProps) => {
  const { slots } = useContext(MeterContext)

  return (
    <div
      className={composeSlotClassName(slots?.track, className)}
      data-slot="meter-track"
      {...props}
    >
      {children}
    </div>
  )
}

/* -------------------------------------------------------------------------------------------------
 * Meter Fill
 * -----------------------------------------------------------------------------------------------*/
type MeterFillProps = ComponentPropsWithRef<"div">

const MeterFill = ({ className, style, ...props }: MeterFillProps) => {
  const { slots, state } = useContext(MeterContext)

  return (
    <div
      className={composeSlotClassName(slots?.fill, className)}
      data-slot="meter-fill"
      style={{
        ...style,
        width: `${state?.percentage ?? 0}%`,
      }}
      {...props}
    />
  )
}

export { MeterRoot, MeterOutput, MeterTrack, MeterFill }
export type {
  MeterRootProps,
  MeterOutputProps,
  MeterTrackProps,
  MeterFillProps,
}
