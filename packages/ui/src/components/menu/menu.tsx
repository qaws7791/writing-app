"use client"

import * as React from "react"
import { Menu as MenuPrimitive } from "@base-ui/react/menu"
import { motion } from "motion/react"
import { cn } from "@workspace/ui/lib/utils"

export interface MenuProps {
  children: React.ReactNode
  className?: string
}

function Menu({ children, className }: MenuProps) {
  return (
    <MenuPrimitive.Root>
      <div className={className}>{children}</div>
    </MenuPrimitive.Root>
  )
}

export interface MenuTriggerProps {
  children: React.ReactNode
  className?: string
}

function MenuTrigger({ children, className }: MenuTriggerProps) {
  return (
    <MenuPrimitive.Trigger
      data-slot="menu-trigger"
      className={cn("inline-flex cursor-pointer", className)}
    >
      {children}
    </MenuPrimitive.Trigger>
  )
}

export interface MenuContentProps {
  children: React.ReactNode
  className?: string
  align?: "start" | "center" | "end"
  side?: "top" | "bottom"
  sideOffset?: number
}

function MenuContent({
  children,
  className,
  align = "start",
  side = "bottom",
  sideOffset = 4,
}: MenuContentProps) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        align={align}
        side={side}
        sideOffset={sideOffset}
      >
        <MenuPrimitive.Popup
          data-slot="menu-content"
          render={
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.15, ease: [0.05, 0.7, 0.1, 1] }}
            />
          }
          className={cn(
            "z-60 max-w-[280px] min-w-[112px] overflow-hidden rounded-[4px] bg-surface-container py-2 shadow-md",
            "outline-none",
            className
          )}
        >
          {children}
        </MenuPrimitive.Popup>
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  )
}

export interface MenuItemProps {
  children: React.ReactNode
  className?: string
  leadingIcon?: React.ReactNode
  trailingText?: string
  destructive?: boolean
  disabled?: boolean
  onClick?: () => void
}

function MenuItem({
  children,
  className,
  leadingIcon,
  trailingText,
  destructive,
  disabled,
  onClick,
}: MenuItemProps) {
  return (
    <MenuPrimitive.Item
      data-slot="menu-item"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "relative flex h-12 w-full cursor-pointer items-center gap-3 px-3 text-body-large outline-none select-none",
        "transition-colors",
        "before:pointer-events-none before:absolute before:inset-0",
        "before:bg-on-surface/8 before:opacity-0 before:transition-opacity hover:before:opacity-100",
        "focus-visible:before:opacity-100",
        destructive ? "text-error" : "text-on-surface",
        disabled && "pointer-events-none opacity-38",
        className
      )}
    >
      {leadingIcon && (
        <span
          className={cn(
            "size-6 shrink-0",
            destructive ? "text-error" : "text-on-surface-low"
          )}
          aria-hidden="true"
        >
          {leadingIcon}
        </span>
      )}
      <span className="flex-1 truncate">{children}</span>
      {trailingText && (
        <span className="shrink-0 text-body-medium text-on-surface-low">
          {trailingText}
        </span>
      )}
    </MenuPrimitive.Item>
  )
}

function MenuDivider({ className }: { className?: string }) {
  return (
    <MenuPrimitive.Separator
      data-slot="menu-divider"
      className={cn("my-1 h-px bg-outline/20", className)}
    />
  )
}

export { Menu, MenuTrigger, MenuContent, MenuItem, MenuDivider }
