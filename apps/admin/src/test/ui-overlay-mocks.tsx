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
    children,
    onClick,
    ...props
  }: React.ComponentPropsWithoutRef<"button">) {
    const { isOpen, setIsOpen } = React.useContext(DropdownMenuContext)

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

  return {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  }
})
