"use client"

import * as React from "react"
import type { ComponentPropsWithRef } from "react"
import { composeTwRenderProps } from "@workspace/ui/utils/compose"
import { sidebarVariants } from "./sidebar.styles"
import {
  ListBox,
  ListBoxItem,
  ListBoxSection,
} from "@workspace/ui/components/list-box"

/* -------------------------------------------------------------------------------------------------
 * Sidebar Root
 * -----------------------------------------------------------------------------------------------*/
interface SidebarRootProps extends ComponentPropsWithRef<"div"> {
  className?: string
}

const SidebarRoot = React.forwardRef<HTMLDivElement, SidebarRootProps>(
  ({ className, children, ...props }, ref) => {
    const slots = React.useMemo(() => sidebarVariants(), [])
    return (
      <aside
        ref={ref}
        className={slots.base({ className })}
        data-slot="sidebar"
        {...props}
      >
        {children}
      </aside>
    )
  }
)
SidebarRoot.displayName = "SidebarRoot"

/* -------------------------------------------------------------------------------------------------
 * Sidebar Header
 * -----------------------------------------------------------------------------------------------*/
interface SidebarHeaderProps extends ComponentPropsWithRef<"div"> {
  className?: string
}

const SidebarHeader = React.forwardRef<HTMLDivElement, SidebarHeaderProps>(
  ({ className, children, ...props }, ref) => {
    const slots = React.useMemo(() => sidebarVariants(), [])
    return (
      <div
        ref={ref}
        className={slots.header({ className })}
        data-slot="sidebar-header"
        {...props}
      >
        {children}
      </div>
    )
  }
)
SidebarHeader.displayName = "SidebarHeader"

/* -------------------------------------------------------------------------------------------------
 * Sidebar Body
 * -----------------------------------------------------------------------------------------------*/
interface SidebarBodyProps<T extends object> extends Omit<
  React.ComponentProps<typeof ListBox<T>>,
  "aria-label"
> {
  className?: string
  "aria-label"?: string
}

function SidebarBody<T extends object>({
  className,
  children,
  "aria-label": ariaLabel = "Sidebar Navigation",
  ...props
}: SidebarBodyProps<T>) {
  const slots = React.useMemo(() => sidebarVariants(), [])
  return (
    <ListBox
      aria-label={ariaLabel}
      className={composeTwRenderProps(className, slots.body())}
      data-slot="sidebar-body"
      {...props}
    >
      {children}
    </ListBox>
  )
}

/* -------------------------------------------------------------------------------------------------
 * Sidebar Footer
 * -----------------------------------------------------------------------------------------------*/
interface SidebarFooterProps<T extends object> extends Omit<
  React.ComponentProps<typeof ListBox<T>>,
  "aria-label"
> {
  className?: string
  "aria-label"?: string
}

function SidebarFooter<T extends object>({
  className,
  children,
  "aria-label": ariaLabel = "Sidebar Footer Navigation",
  ...props
}: SidebarFooterProps<T>) {
  const slots = React.useMemo(() => sidebarVariants(), [])
  return (
    <ListBox
      aria-label={ariaLabel}
      className={composeTwRenderProps(className, slots.footer())}
      data-slot="sidebar-footer"
      {...props}
    >
      {children}
    </ListBox>
  )
}

/* -------------------------------------------------------------------------------------------------
 * Sidebar Item Exports
 * -----------------------------------------------------------------------------------------------*/
const SidebarItem = ListBoxItem
const SidebarSection = ListBoxSection

export {
  SidebarRoot,
  SidebarHeader,
  SidebarBody,
  SidebarFooter,
  SidebarItem,
  SidebarSection,
}

export type {
  SidebarRootProps,
  SidebarHeaderProps,
  SidebarBodyProps,
  SidebarFooterProps,
}
