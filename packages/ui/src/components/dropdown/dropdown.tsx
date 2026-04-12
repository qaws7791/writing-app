"use client"

import type { SurfaceVariants } from "@workspace/ui/components/surface"
import type { DropdownVariants } from "./dropdown.styles"
import type { ComponentPropsWithRef } from "react"

import React, { createContext, useContext } from "react"
import {
  Button,
  Menu as MenuPrimitive,
  MenuTrigger as MenuTriggerPrimitive,
  Popover as PopoverPrimitive,
  SubmenuTrigger as SubmenuTriggerPrimitive,
} from "react-aria-components"

import { composeTwRenderProps } from "@workspace/ui/utils/compose"
import {
  MenuItemRoot,
  MenuItemIndicator,
  MenuItemSubmenuIndicator,
} from "@workspace/ui/components/menu-item"
import { MenuSectionRoot } from "@workspace/ui/components/menu-section"
import { SurfaceContext } from "@workspace/ui/components/surface"

import { dropdownVariants } from "./dropdown.styles"

/* -------------------------------------------------------------------------------------------------
 * Dropdown Context
 * -----------------------------------------------------------------------------------------------*/
type DropdownContext = {
  slots?: ReturnType<typeof dropdownVariants>
}

const DropdownContext = createContext<DropdownContext>({})

/* -------------------------------------------------------------------------------------------------
 * Dropdown Root (MenuTrigger wrapper)
 * -----------------------------------------------------------------------------------------------*/
interface DropdownRootProps
  extends ComponentPropsWithRef<typeof MenuTriggerPrimitive>, DropdownVariants {
  className?: string
}

const DropdownRoot = ({ children, ...props }: DropdownRootProps) => {
  const slots = React.useMemo(() => dropdownVariants(), [])

  return (
    <DropdownContext value={{ slots }}>
      <MenuTriggerPrimitive {...props}>{children}</MenuTriggerPrimitive>
    </DropdownContext>
  )
}

/* -------------------------------------------------------------------------------------------------
 * Dropdown Trigger (Button wrapper)
 * -----------------------------------------------------------------------------------------------*/
type DropdownTriggerProps = ComponentPropsWithRef<typeof Button>

const DropdownTrigger = ({
  children,
  className,
  ...props
}: DropdownTriggerProps) => {
  const { slots } = useContext(DropdownContext)

  return (
    <Button
      className={composeTwRenderProps(className, slots?.trigger())}
      data-slot="dropdown-trigger"
      {...props}
    >
      {(values) => (
        <>{typeof children === "function" ? children(values) : children}</>
      )}
    </Button>
  )
}

/* -------------------------------------------------------------------------------------------------
 * Dropdown Popover (Popover wrapper)
 * -----------------------------------------------------------------------------------------------*/
interface DropdownPopoverProps
  extends
    Omit<ComponentPropsWithRef<typeof PopoverPrimitive>, "children">,
    DropdownVariants {
  children: React.ReactNode
}

const DropdownPopover = ({
  children,
  className,
  placement,
  ...props
}: DropdownPopoverProps) => {
  const { slots } = useContext(DropdownContext)

  return (
    <SurfaceContext
      value={{
        variant: "default" as SurfaceVariants["variant"],
      }}
    >
      <PopoverPrimitive
        {...props}
        className={composeTwRenderProps(className, slots?.popover())}
        placement={placement}
      >
        {children}
      </PopoverPrimitive>
    </SurfaceContext>
  )
}

/* -------------------------------------------------------------------------------------------------
 * Dropdown Menu (Menu wrapper)
 * -----------------------------------------------------------------------------------------------*/
interface DropdownMenuProps<T extends object>
  extends ComponentPropsWithRef<typeof MenuPrimitive<T>>, DropdownVariants {
  className?: string
}

function DropdownMenu<T extends object>({
  className,
  ...props
}: DropdownMenuProps<T>) {
  const { slots } = useContext(DropdownContext)

  return (
    <MenuPrimitive
      className={composeTwRenderProps(className, slots?.menu())}
      data-selection-mode={props.selectionMode}
      data-slot="dropdown-menu"
      {...props}
    />
  )
}

/* -------------------------------------------------------------------------------------------------
 * Dropdown Item (MenuItem wrapper)
 * -----------------------------------------------------------------------------------------------*/
type DropdownItemProps = ComponentPropsWithRef<typeof MenuItemRoot>

const DropdownItem = (props: DropdownItemProps) => {
  return <MenuItemRoot {...props} />
}

/* -------------------------------------------------------------------------------------------------
 * Dropdown Submenu Indicator (MenuItemSubmenuIndicator wrapper)
 * -----------------------------------------------------------------------------------------------*/
type DropdownSubmenuIndicatorProps = ComponentPropsWithRef<
  typeof MenuItemSubmenuIndicator
>

const DropdownSubmenuIndicator = (props: DropdownSubmenuIndicatorProps) => {
  return <MenuItemSubmenuIndicator {...props} />
}

/* -------------------------------------------------------------------------------------------------
 * Dropdown Submenu Trigger
 * -----------------------------------------------------------------------------------------------*/
type DropdownSubmenuTriggerProps = ComponentPropsWithRef<
  typeof SubmenuTriggerPrimitive
>

const DropdownSubmenuTrigger = ({
  children,
  ...props
}: DropdownSubmenuTriggerProps) => {
  return (
    <SubmenuTriggerPrimitive data-slot="dropdown-submenu-trigger" {...props}>
      {children}
    </SubmenuTriggerPrimitive>
  )
}

/* -------------------------------------------------------------------------------------------------
 * Dropdown Item Indicator (MenuItemIndicator wrapper)
 * -----------------------------------------------------------------------------------------------*/
type DropdownItemIndicatorProps = ComponentPropsWithRef<
  typeof MenuItemIndicator
>

const DropdownItemIndicator = (props: DropdownItemIndicatorProps) => {
  return <MenuItemIndicator {...props} />
}

/* -------------------------------------------------------------------------------------------------
 * Dropdown Section (MenuSection wrapper)
 * -----------------------------------------------------------------------------------------------*/
type DropdownSectionProps = ComponentPropsWithRef<typeof MenuSectionRoot>

const DropdownSection = (props: DropdownSectionProps) => {
  return <MenuSectionRoot {...props} />
}

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  DropdownRoot,
  DropdownTrigger,
  DropdownPopover,
  DropdownMenu,
  DropdownItem,
  DropdownSection,
  DropdownItemIndicator,
  DropdownSubmenuIndicator,
  DropdownSubmenuTrigger,
}

export type {
  DropdownRootProps,
  DropdownTriggerProps,
  DropdownPopoverProps,
  DropdownMenuProps,
  DropdownItemProps,
  DropdownSectionProps,
  DropdownItemIndicatorProps,
  DropdownSubmenuIndicatorProps,
  DropdownSubmenuTriggerProps,
}
