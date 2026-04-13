"use client"

import type { ComponentPropsWithRef } from "react"
import type { ListBoxItemRenderProps } from "react-aria-components"

import React, { createContext, useContext, useMemo } from "react"
import {
  ListBox as ListBoxPrimitive,
  ListBoxItem as ListBoxItemPrimitive,
  ListBoxSection as ListBoxSectionPrimitive,
} from "react-aria-components"

import type { ListBoxItemVariants, ListBoxVariants } from "./list-box.styles"

import {
  composeSlotClassName,
  composeTwRenderProps,
} from "@workspace/ui/utils/compose"

import {
  listboxItemVariants,
  listboxSectionVariants,
  listboxVariants,
} from "./list-box.styles"

/* -------------------------------------------------------------------------------------------------
 * ListBox Root
 * -----------------------------------------------------------------------------------------------*/
interface ListBoxRootProps<T extends object>
  extends ComponentPropsWithRef<typeof ListBoxPrimitive<T>>, ListBoxVariants {
  className?: string
}

function ListBoxRoot<T extends object>({
  className,
  variant,
  ...props
}: ListBoxRootProps<T>) {
  const styles = useMemo(() => listboxVariants({ variant }), [variant])

  return (
    <ListBoxPrimitive
      className={composeTwRenderProps(className, styles)}
      data-slot="list-box"
      {...props}
    />
  )
}

/* -------------------------------------------------------------------------------------------------
 * ListBox Item Context
 * -----------------------------------------------------------------------------------------------*/
interface ListBoxItemContext {
  slots?: ReturnType<typeof listboxItemVariants>
  state?: ListBoxItemRenderProps
}

const ListBoxItemContext = createContext<ListBoxItemContext>({})

/* -------------------------------------------------------------------------------------------------
 * ListBox Item Root
 * -----------------------------------------------------------------------------------------------*/
interface ListBoxItemRootProps
  extends
    ComponentPropsWithRef<typeof ListBoxItemPrimitive>,
    ListBoxItemVariants {
  className?: string
}

const ListBoxItemRoot = ({
  children,
  className,
  variant,
  ...props
}: ListBoxItemRootProps) => {
  const slots = useMemo(() => listboxItemVariants({ variant }), [variant])

  return (
    <ListBoxItemPrimitive
      className={composeTwRenderProps(className, slots.item())}
      data-slot="list-box-item"
      {...props}
    >
      {(values) => (
        <ListBoxItemContext value={{ slots, state: values }}>
          {typeof children === "function" ? children(values) : children}
        </ListBoxItemContext>
      )}
    </ListBoxItemPrimitive>
  )
}

/* -------------------------------------------------------------------------------------------------
 * ListBox Item Indicator
 * -----------------------------------------------------------------------------------------------*/
interface ListBoxItemIndicatorProps extends Omit<
  ComponentPropsWithRef<"span">,
  "children"
> {
  children?:
    | React.ReactNode
    | ((props: ListBoxItemRenderProps) => React.ReactNode)
}

const ListBoxItemIndicator = ({
  children,
  className,
  ...props
}: ListBoxItemIndicatorProps) => {
  const { slots, state } = useContext(ListBoxItemContext)
  const isSelected = state?.isSelected

  const content =
    typeof children === "function" ? (
      children(state ?? ({} as ListBoxItemRenderProps))
    ) : children ? (
      children
    ) : (
      <svg
        aria-hidden="true"
        data-slot="list-box-item-indicator--checkmark"
        fill="none"
        role="presentation"
        stroke="currentColor"
        strokeDasharray={22}
        strokeDashoffset={isSelected ? 44 : 66}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        viewBox="0 0 17 18"
      >
        <polyline points="1 9 7 14 15 4" />
      </svg>
    )

  return (
    <span
      aria-hidden="true"
      className={composeSlotClassName(slots?.indicator, className)}
      data-slot="list-box-item-indicator"
      data-visible={isSelected || undefined}
      {...props}
    >
      {content}
    </span>
  )
}

/* -------------------------------------------------------------------------------------------------
 * ListBox Section
 * -----------------------------------------------------------------------------------------------*/
interface ListBoxSectionRootProps extends ComponentPropsWithRef<
  typeof ListBoxSectionPrimitive
> {
  className?: string
}

const ListBoxSectionRoot = ({
  children,
  className,
  ...props
}: ListBoxSectionRootProps) => {
  const styles = useMemo(
    () =>
      listboxSectionVariants({
        class: typeof className === "string" ? className : undefined,
      }),
    [className]
  )

  return (
    <ListBoxSectionPrimitive className={styles} {...props}>
      {children}
    </ListBoxSectionPrimitive>
  )
}

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  ListBoxRoot,
  ListBoxItemRoot,
  ListBoxItemRoot as ListBoxItem,
  ListBoxItemIndicator,
  ListBoxSectionRoot,
  ListBoxSectionRoot as ListBoxSection,
}

export type {
  ListBoxRootProps,
  ListBoxItemRootProps,
  ListBoxItemRootProps as ListBoxItemProps,
  ListBoxItemIndicatorProps,
  ListBoxSectionRootProps,
  ListBoxSectionRootProps as ListBoxSectionProps,
}
