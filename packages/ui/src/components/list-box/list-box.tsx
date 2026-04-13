"use client"

import type { ComponentPropsWithRef } from "react"

import { useMemo } from "react"
import {
  ListBox as ListBoxPrimitive,
  ListBoxItem as ListBoxItemPrimitive,
} from "react-aria-components"

import type { ListBoxItemVariants, ListBoxVariants } from "./list-box.styles"

import { composeTwRenderProps } from "@workspace/ui/utils/compose"

import { listBoxItemVariants, listBoxVariants } from "./list-box.styles"

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
  const styles = useMemo(() => listBoxVariants({ variant }), [variant])

  return (
    <ListBoxPrimitive
      className={composeTwRenderProps(className, styles)}
      data-slot="list-box"
      {...props}
    />
  )
}

/* -------------------------------------------------------------------------------------------------
 * ListBox Item
 * -----------------------------------------------------------------------------------------------*/
type ListBoxItemProps = ComponentPropsWithRef<typeof ListBoxItemPrimitive> &
  ListBoxItemVariants

const ListBoxItem = ({ className, variant, ...props }: ListBoxItemProps) => {
  const slots = useMemo(() => listBoxItemVariants({ variant }), [variant])

  return (
    <ListBoxItemPrimitive
      className={composeTwRenderProps(className, slots.item())}
      data-slot="list-box-item"
      {...props}
    />
  )
}

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export { ListBoxRoot, ListBoxItem }

export type { ListBoxRootProps, ListBoxItemProps }
