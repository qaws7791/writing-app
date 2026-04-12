"use client"

import type { ComponentPropsWithRef } from "react"

import { useMemo } from "react"
import { ListBox as ListBoxPrimitive } from "react-aria-components"

import type { ListBoxVariants } from "./list-box.styles"

import { composeTwRenderProps } from "@workspace/ui/utils/compose"

import { listBoxVariants } from "./list-box.styles"

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
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export { ListBoxRoot }

export type { ListBoxRootProps }
