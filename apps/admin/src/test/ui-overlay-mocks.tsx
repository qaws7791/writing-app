import { vi } from "vitest"

vi.mock("@workspace/ui/components/ui/collapsible", async () => {
  const React = await import("react")
  const CollapsibleContext = React.createContext<{
    isOpen: boolean
    setIsOpen: (isOpen: boolean) => void
  }>({
    isOpen: true,
    setIsOpen: () => undefined,
  })

  function Collapsible({
    children,
    open,
    onOpenChange,
  }: React.PropsWithChildren<{
    open?: boolean
    onOpenChange?: (isOpen: boolean) => void
  }>) {
    const [internalOpen, setInternalOpen] = React.useState(open ?? true)
    const isOpen = open ?? internalOpen

    function setIsOpen(nextOpen: boolean) {
      setInternalOpen(nextOpen)
      onOpenChange?.(nextOpen)
    }

    return (
      <CollapsibleContext.Provider value={{ isOpen, setIsOpen }}>
        {children}
      </CollapsibleContext.Provider>
    )
  }

  function CollapsibleTrigger({
    children,
    onClick,
    ...props
  }: React.ComponentPropsWithoutRef<"button">) {
    const { isOpen, setIsOpen } = React.useContext(CollapsibleContext)

    return (
      <button
        type="button"
        {...props}
        onClick={(event) => {
          onClick?.(event)
          setIsOpen(!isOpen)
        }}
      >
        {children}
      </button>
    )
  }

  function CollapsibleContent({
    children,
    ...props
  }: React.ComponentPropsWithoutRef<"div">) {
    const { isOpen } = React.useContext(CollapsibleContext)

    return isOpen ? <div {...props}>{children}</div> : null
  }

  return { Collapsible, CollapsibleContent, CollapsibleTrigger }
})

vi.mock("@workspace/ui/components/ui/popover", async () => {
  const React = await import("react")
  const PopoverContext = React.createContext<{
    isOpen: boolean
    setIsOpen: (isOpen: boolean) => void
  }>({
    isOpen: false,
    setIsOpen: () => undefined,
  })

  function Popover({ children }: React.PropsWithChildren) {
    const [isOpen, setIsOpen] = React.useState(false)

    return (
      <PopoverContext.Provider value={{ isOpen, setIsOpen }}>
        {children}
      </PopoverContext.Provider>
    )
  }

  function PopoverTrigger({
    children,
    onClick,
    ...props
  }: React.ComponentPropsWithoutRef<"button">) {
    const { isOpen, setIsOpen } = React.useContext(PopoverContext)

    return (
      <button
        type="button"
        {...props}
        onClick={(event) => {
          onClick?.(event)
          setIsOpen(!isOpen)
        }}
      >
        {children}
      </button>
    )
  }

  function PopoverContent({
    children,
    ...props
  }: React.ComponentPropsWithoutRef<"div">) {
    const { isOpen } = React.useContext(PopoverContext)

    return isOpen ? <div {...props}>{children}</div> : null
  }

  return { Popover, PopoverContent, PopoverTrigger }
})

vi.mock("@workspace/ui/components/ui/dropdown-menu", async () => {
  const React = await import("react")
  const DropdownMenuContext = React.createContext<{
    isOpen: boolean
    setIsOpen: (isOpen: boolean) => void
  }>({
    isOpen: false,
    setIsOpen: () => undefined,
  })

  function DropdownMenu({ children }: React.PropsWithChildren) {
    const [isOpen, setIsOpen] = React.useState(false)

    return (
      <DropdownMenuContext.Provider value={{ isOpen, setIsOpen }}>
        {children}
      </DropdownMenuContext.Provider>
    )
  }

  function DropdownMenuTrigger({
    asChild,
    children,
    onClick,
    ...props
  }: React.ComponentPropsWithoutRef<"button"> & { asChild?: boolean }) {
    const { isOpen, setIsOpen } = React.useContext(DropdownMenuContext)
    const handleClick: React.MouseEventHandler<HTMLButtonElement> = (event) => {
      onClick?.(event)
      setIsOpen(!isOpen)
    }

    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<
        React.ComponentPropsWithoutRef<"button">
      >

      return React.cloneElement(child, {
        ...props,
        onClick: (event) => {
          child.props.onClick?.(event)
          handleClick(event)
        },
      })
    }

    return (
      <button type="button" {...props} onClick={handleClick}>
        {children}
      </button>
    )
  }

  function DropdownMenuContent({
    children,
    ...props
  }: React.ComponentPropsWithoutRef<"div">) {
    const { isOpen } = React.useContext(DropdownMenuContext)

    return isOpen ? <div {...props}>{children}</div> : null
  }

  function DropdownMenuItem({
    children,
    onClick,
    ...props
  }: React.ComponentPropsWithoutRef<"button">) {
    return (
      <button type="button" {...props} onClick={onClick}>
        {children}
      </button>
    )
  }

  function DropdownMenuLabel({
    children,
    ...props
  }: React.ComponentPropsWithoutRef<"div">) {
    return <div {...props}>{children}</div>
  }

  function DropdownMenuSeparator({
    ...props
  }: React.ComponentPropsWithoutRef<"div">) {
    return <div role="separator" {...props} />
  }

  return {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  }
})

vi.mock("@workspace/ui/components/ui/alert-dialog", async () => {
  const React = await import("react")
  const AlertDialogContext = React.createContext<{
    isOpen: boolean
    setIsOpen: (isOpen: boolean) => void
  }>({
    isOpen: false,
    setIsOpen: () => undefined,
  })

  function AlertDialog({
    children,
    open,
    onOpenChange,
  }: React.PropsWithChildren<{
    open?: boolean
    onOpenChange?: (isOpen: boolean) => void
  }>) {
    function setIsOpen(nextOpen: boolean) {
      onOpenChange?.(nextOpen)
    }

    return (
      <AlertDialogContext.Provider value={{ isOpen: open ?? false, setIsOpen }}>
        {children}
      </AlertDialogContext.Provider>
    )
  }

  function AlertDialogContent({
    children,
    ...props
  }: React.ComponentPropsWithoutRef<"div">) {
    const { isOpen } = React.useContext(AlertDialogContext)

    return isOpen ? (
      <div role="alertdialog" {...props}>
        {children}
      </div>
    ) : null
  }

  function AlertDialogCancel({
    children,
    onClick,
    ...props
  }: React.ComponentPropsWithoutRef<"button">) {
    const { setIsOpen } = React.useContext(AlertDialogContext)

    return (
      <button
        type="button"
        {...props}
        onClick={(event) => {
          onClick?.(event)
          setIsOpen(false)
        }}
      >
        {children}
      </button>
    )
  }

  function AlertDialogAction({
    children,
    onClick,
    ...props
  }: React.ComponentPropsWithoutRef<"button">) {
    return (
      <button type="button" {...props} onClick={onClick}>
        {children}
      </button>
    )
  }

  function AlertDialogMedia({
    children,
    ...props
  }: React.ComponentPropsWithoutRef<"div">) {
    return <div {...props}>{children}</div>
  }

  function AlertDialogPassthrough({
    children,
    ...props
  }: React.ComponentPropsWithoutRef<"div">) {
    return <div {...props}>{children}</div>
  }

  return {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription: AlertDialogPassthrough,
    AlertDialogFooter: AlertDialogPassthrough,
    AlertDialogHeader: AlertDialogPassthrough,
    AlertDialogMedia,
    AlertDialogTitle: AlertDialogPassthrough,
  }
})
