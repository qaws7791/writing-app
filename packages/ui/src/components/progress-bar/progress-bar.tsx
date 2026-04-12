"use client"

import type { ComponentPropsWithRef } from "react"
import type { ProgressBarRenderProps } from "react-aria-components"

import { createContext, useContext, useMemo } from "react"
import { ProgressBar as ProgressBarPrimitive } from "react-aria-components"

import type { ProgressBarVariants } from "./progress-bar.styles"

import {
  composeSlotClassName,
  composeTwRenderProps,
} from "@workspace/ui/utils/compose"

import { progressBarVariants } from "./progress-bar.styles"

/* -------------------------------------------------------------------------------------------------
 * ProgressBar Context
 * -----------------------------------------------------------------------------------------------*/
interface ProgressBarContext {
  slots?: ReturnType<typeof progressBarVariants>
  state?: ProgressBarRenderProps
}

const ProgressBarContext = createContext<ProgressBarContext>({})

/* -------------------------------------------------------------------------------------------------
 * ProgressBar Root
 * -----------------------------------------------------------------------------------------------*/
interface ProgressBarRootProps
  extends
    ComponentPropsWithRef<typeof ProgressBarPrimitive>,
    ProgressBarVariants {}

const ProgressBarRoot = ({
  children,
  className,
  color,
  size,
  ...props
}: ProgressBarRootProps) => {
  const slots = useMemo(
    () => progressBarVariants({ color, size }),
    [color, size]
  )

  return (
    <ProgressBarPrimitive
      data-slot="progress-bar"
      {...props}
      className={composeTwRenderProps(className, slots.base())}
    >
      {(values) => (
        <ProgressBarContext value={{ slots, state: values }}>
          {typeof children === "function" ? children(values) : children}
        </ProgressBarContext>
      )}
    </ProgressBarPrimitive>
  )
}

/* -------------------------------------------------------------------------------------------------
 * ProgressBar Output
 * -----------------------------------------------------------------------------------------------*/
type ProgressBarOutputProps = ComponentPropsWithRef<"span">

const ProgressBarOutput = ({
  children,
  className,
  ...props
}: ProgressBarOutputProps) => {
  const { slots, state } = useContext(ProgressBarContext)

  return (
    <span
      className={composeSlotClassName(slots?.output, className)}
      data-slot="progress-bar-output"
      {...props}
    >
      {children ?? state?.valueText}
    </span>
  )
}

/* -------------------------------------------------------------------------------------------------
 * ProgressBar Track
 * -----------------------------------------------------------------------------------------------*/
type ProgressBarTrackProps = ComponentPropsWithRef<"div">

const ProgressBarTrack = ({
  children,
  className,
  ...props
}: ProgressBarTrackProps) => {
  const { slots } = useContext(ProgressBarContext)

  return (
    <div
      className={composeSlotClassName(slots?.track, className)}
      data-slot="progress-bar-track"
      {...props}
    >
      {children}
    </div>
  )
}

/* -------------------------------------------------------------------------------------------------
 * ProgressBar Fill
 * -----------------------------------------------------------------------------------------------*/
type ProgressBarFillProps = ComponentPropsWithRef<"div">

const ProgressBarFill = ({
  className,
  style,
  ...props
}: ProgressBarFillProps) => {
  const { slots, state } = useContext(ProgressBarContext)

  return (
    <div
      className={composeSlotClassName(slots?.fill, className)}
      data-slot="progress-bar-fill"
      style={{
        ...style,
        width: state?.isIndeterminate
          ? undefined
          : `${state?.percentage ?? 0}%`,
      }}
      {...props}
    />
  )
}

export { ProgressBarRoot, ProgressBarOutput, ProgressBarTrack, ProgressBarFill }
export type {
  ProgressBarRootProps,
  ProgressBarOutputProps,
  ProgressBarTrackProps,
  ProgressBarFillProps,
}
