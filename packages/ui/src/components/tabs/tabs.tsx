"use client"

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"

function Tabs({ className, ...props }: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-0", className)}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  "inline-flex w-full items-center border-b border-outline/20",
  {
    variants: {
      variant: {
        primary: "gap-0",
        secondary:
          "gap-0 rounded-full border-none bg-surface-container-low p-1",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  }
)

function TabsList({
  className,
  variant = "primary",
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex h-12 flex-1 cursor-pointer items-center justify-center gap-1.5 text-label-large",
        "text-on-surface-low transition-colors select-none",
        "hover:text-on-surface",
        "focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary",
        "disabled:pointer-events-none disabled:opacity-38",
        "data-active:text-primary",
        "after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:rounded-t-full",
        "after:duration-short3 after:scale-x-0 after:bg-primary after:transition-transform after:ease-standard",
        "data-active:after:scale-x-100",
        "group-data-[variant=secondary]:h-9 group-data-[variant=secondary]:rounded-full",
        "group-data-[variant=secondary]:after:hidden",
        "group-data-[variant=secondary]:data-active:bg-secondary-container group-data-[variant=secondary]:data-active:text-on-secondary-container",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("flex-1 pt-4 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
