"use client"

import * as React from "react"
import { Menu as MenuPrimitive } from "@base-ui/react/menu"

import { cn } from "../../lib/utils"

type DropdownMenuContextValue = {
  readonly handle: MenuPrimitive.Handle<unknown>
}

const DropdownMenuContext =
  React.createContext<DropdownMenuContextValue | null>(null)

function DropdownMenu({
  handle: handleProp,
  modal = false,
  ...props
}: MenuPrimitive.Root.Props) {
  const generatedHandle = React.useMemo(
    () => MenuPrimitive.createHandle<unknown>(),
    []
  )
  const handle = handleProp ?? generatedHandle

  return (
    <DropdownMenuContext.Provider value={{ handle }}>
      <MenuPrimitive.Root
        data-slot="dropdown-menu"
        handle={handle}
        modal={modal}
        {...props}
      />
    </DropdownMenuContext.Provider>
  )
}

function DropdownMenuTrigger({
  className,
  disabled,
  handle: handleProp,
  id: idProp,
  onClick,
  onKeyDown,
  onKeyDownCapture,
  onMouseDownCapture,
  onPointerDownCapture,
  ...props
}: MenuPrimitive.Trigger.Props) {
  const context = React.useContext(DropdownMenuContext)
  const generatedId = React.useId()
  const handle = handleProp ?? context?.handle
  const id = idProp ?? generatedId
  const openBeforePressRef = React.useRef(false)

  function rememberOpenState() {
    openBeforePressRef.current = handle?.isOpen ?? false
  }

  function toggleWhenBaseUiDidNot(event: React.SyntheticEvent) {
    if (!handle || disabled || event.defaultPrevented) {
      return
    }

    const wasOpen = openBeforePressRef.current

    if (handle.isOpen !== wasOpen) {
      return
    }

    if (wasOpen) {
      handle.close()
      return
    }

    handle.open(id)
  }

  return (
    <MenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      disabled={disabled}
      handle={handle}
      id={id}
      className={cn(
        "inline-flex h-(--control-height-md) items-center justify-center gap-2 rounded-control px-(--control-inline-padding) text-sm font-bold text-fg-default transition-colors outline-none hover:bg-bg-surface focus-visible:border-border-focus focus-visible:ring-3 focus-visible:ring-border-focus/20 disabled:pointer-events-none disabled:opacity-50 data-[popup-open]:bg-bg-surface",
        className
      )}
      onClick={(event) => {
        onClick?.(event)
        toggleWhenBaseUiDidNot(event)
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event)

        if (event.key === "Enter" || event.key === " ") {
          toggleWhenBaseUiDidNot(event)
        }
      }}
      onKeyDownCapture={(event) => {
        onKeyDownCapture?.(event)
        rememberOpenState()
      }}
      onMouseDownCapture={(event) => {
        onMouseDownCapture?.(event)
        rememberOpenState()
      }}
      onPointerDownCapture={(event) => {
        onPointerDownCapture?.(event)
        rememberOpenState()
      }}
      {...props}
    />
  )
}

function DropdownMenuContent({
  align = "end",
  className,
  sideOffset = 8,
  ...props
}: MenuPrimitive.Popup.Props & {
  readonly align?: MenuPrimitive.Positioner.Props["align"]
  readonly sideOffset?: MenuPrimitive.Positioner.Props["sideOffset"]
}) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner align={align} sideOffset={sideOffset}>
        <MenuPrimitive.Popup
          data-slot="dropdown-menu-content"
          className={cn(
            "z-50 grid min-w-48 gap-1 rounded-card border border-border-default bg-bg-elevated p-2 text-fg-default shadow-dialog outline-none data-[ending-style]:animate-out data-[ending-style]:fade-out-0 data-[starting-style]:animate-in data-[starting-style]:fade-in-0",
            className
          )}
          {...props}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  )
}

type DropdownMenuItemTone = "danger" | "neutral"

function dropdownMenuItemClassName({
  className,
  tone = "neutral",
}: {
  readonly className?: string
  readonly tone?: DropdownMenuItemTone
}) {
  return cn(
    "flex min-h-10 w-full items-center rounded-control px-3 text-left text-sm font-bold transition-colors outline-none data-[highlighted]:bg-bg-surface data-[highlighted]:text-fg-default data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
    tone === "danger" ? "text-danger-fg" : "text-fg-default",
    className
  )
}

function DropdownMenuItem({
  className,
  tone = "neutral",
  ...props
}: Omit<MenuPrimitive.Item.Props, "className"> & {
  readonly className?: string
  readonly tone?: DropdownMenuItemTone
}) {
  return (
    <MenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-tone={tone}
      className={dropdownMenuItemClassName({ className, tone })}
      {...props}
    />
  )
}

function DropdownMenuLinkItem({
  className,
  closeOnClick = true,
  tone = "neutral",
  ...props
}: Omit<MenuPrimitive.LinkItem.Props, "className"> & {
  readonly className?: string
  readonly tone?: DropdownMenuItemTone
}) {
  return (
    <MenuPrimitive.LinkItem
      closeOnClick={closeOnClick}
      data-slot="dropdown-menu-link-item"
      data-tone={tone}
      className={dropdownMenuItemClassName({ className, tone })}
      {...props}
    />
  )
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Separator>) {
  return (
    <MenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn("-mx-1 my-1 h-px bg-border-subtle", className)}
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
}
