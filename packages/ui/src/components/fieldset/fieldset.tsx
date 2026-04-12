"use client"

import type { ComponentPropsWithRef } from "react"

import { createContext, useContext, useMemo } from "react"

import type { FieldsetVariants } from "./fieldset.styles"

import { composeSlotClassName } from "@workspace/ui/utils/compose"

import { fieldsetVariants } from "./fieldset.styles"

/* -------------------------------------------------------------------------------------------------
 * Fieldset Context
 * -----------------------------------------------------------------------------------------------*/
type FieldsetContext = {
  slots?: ReturnType<typeof fieldsetVariants>
}

const FieldsetContext = createContext<FieldsetContext>({})

/* -------------------------------------------------------------------------------------------------
 * Fieldset Root
 * -----------------------------------------------------------------------------------------------*/
interface FieldsetRootProps
  extends ComponentPropsWithRef<"fieldset">, FieldsetVariants {}

const FieldsetRoot = ({ className, ...props }: FieldsetRootProps) => {
  const slots = useMemo(() => fieldsetVariants({}), [])

  return (
    <FieldsetContext value={{ slots }}>
      <fieldset
        className={slots?.base({ className })}
        data-slot="fieldset"
        {...props}
      />
    </FieldsetContext>
  )
}

/* -------------------------------------------------------------------------------------------------
 * Fieldset Legend
 * -----------------------------------------------------------------------------------------------*/
type FieldsetLegendProps = ComponentPropsWithRef<"legend">

const FieldsetLegend = ({ className, ...props }: FieldsetLegendProps) => {
  const { slots } = useContext(FieldsetContext)

  return (
    <legend
      className={composeSlotClassName(slots?.legend, className)}
      data-slot="fieldset-legend"
      {...props}
    />
  )
}

/* -------------------------------------------------------------------------------------------------
 * Field Group
 * -----------------------------------------------------------------------------------------------*/
type FieldGroupProps = ComponentPropsWithRef<"div">

const FieldGroup = ({ className, ...rest }: FieldGroupProps) => {
  const { slots } = useContext(FieldsetContext)

  return (
    <div
      className={composeSlotClassName(slots?.fieldGroup, className)}
      data-slot="fieldset-field-group"
      {...rest}
    />
  )
}

/* -------------------------------------------------------------------------------------------------
 * Fieldset Actions
 * -----------------------------------------------------------------------------------------------*/
type FieldsetActionsProps = ComponentPropsWithRef<"div">

const FieldsetActions = ({
  children,
  className,
  ...rest
}: FieldsetActionsProps) => {
  const { slots } = useContext(FieldsetContext)

  return (
    <div
      className={composeSlotClassName(slots?.actions, className)}
      data-slot="fieldset-actions"
      {...rest}
    >
      {children}
    </div>
  )
}

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export { FieldsetRoot, FieldsetLegend, FieldGroup, FieldsetActions }

export type {
  FieldsetRootProps,
  FieldsetLegendProps,
  FieldGroupProps,
  FieldsetActionsProps,
}
