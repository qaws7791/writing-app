"use client"

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "#ui/lib/utils"

/**
 * `Tabs` 컴포넌트는 여러 섹션을 탭으로 구분하여 한번에 하나의 섹션을 보여줍니다.
 *
 * @example
 * ```tsx
 * <Tabs defaultValue="account" className="w-[400px]">
 *   <TabsList>
 *     <TabsTrigger value="account">Account</TabsTrigger>
 *     <TabsTrigger value="password">Password</TabsTrigger>
 *   </TabsList>
 *   <TabsContent value="account">Make changes to your account here.</TabsContent>
 *   <TabsContent value="password">Change your password here.</TabsContent>
 * </Tabs>
 * ```
 */
function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "group/tabs flex gap-2 data-horizontal:flex-col",
        className
      )}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  "group/tabs-list relative inline-flex w-fit items-center group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col",
  {
    variants: {
      variant: {
        default:
          "h-auto gap-1 rounded-pill bg-surface p-1 text-muted-foreground",
        line: "h-auto gap-1 bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const tabsIndicatorVariants = cva(
  "pointer-events-none absolute left-0 top-0 z-0 transition-[translate,width,height] duration-(--motion-duration-normal) ease-(--motion-ease-press)",
  {
    variants: {
      variant: {
        default:
          "h-(--active-tab-height) w-(--active-tab-width) translate-x-(--active-tab-left) translate-y-(--active-tab-top) rounded-pill bg-bg-elevated shadow-sm",
        line: "bg-fg-default group-data-horizontal/tabs:h-0.5 group-data-horizontal/tabs:w-(--active-tab-width) group-data-horizontal/tabs:translate-x-(--active-tab-left) group-data-horizontal/tabs:translate-y-[calc(var(--active-tab-top)+var(--active-tab-height)-0.125rem)] group-data-vertical/tabs:left-[calc(var(--active-tab-left)+var(--active-tab-width)-0.125rem)] group-data-vertical/tabs:h-(--active-tab-height) group-data-vertical/tabs:w-0.5 group-data-vertical/tabs:translate-x-0 group-data-vertical/tabs:translate-y-(--active-tab-top)",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function TabsIndicator({
  variant = "default",
}: VariantProps<typeof tabsIndicatorVariants>) {
  return (
    <TabsPrimitive.Indicator
      data-slot="tabs-indicator"
      renderBeforeHydration
      className={cn(tabsIndicatorVariants({ variant }))}
    />
  )
}

function TabsList({
  className,
  variant = "default",
  children,
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    >
      {children}
      <TabsIndicator variant={variant} />
    </TabsPrimitive.List>
  )
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "relative z-10 inline-flex shrink-0 items-center justify-center gap-1.5 border border-transparent whitespace-nowrap outline-none transition-colors duration-(--motion-duration-normal) focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50 has-data-[icon=inline-end]:pr-1 has-data-[icon=inline-start]:pl-1 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start",
        "group-data-[variant=default]/tabs-list:h-9 group-data-[variant=default]/tabs-list:flex-1 group-data-[variant=default]/tabs-list:rounded-pill group-data-[variant=default]/tabs-list:px-4 group-data-[variant=default]/tabs-list:text-body-sm group-data-[variant=default]/tabs-list:font-bold group-data-[variant=default]/tabs-list:bg-transparent group-data-[variant=default]/tabs-list:text-muted-foreground group-data-[variant=default]/tabs-list:hover:text-foreground group-data-[variant=default]/tabs-list:data-active:text-fg-default group-data-[variant=default]/tabs-list:data-active:hover:text-fg-default",
        "group-data-[variant=line]/tabs-list:rounded-none group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:px-3 group-data-[variant=line]/tabs-list:py-2 group-data-[variant=line]/tabs-list:text-body-sm group-data-[variant=line]/tabs-list:font-medium group-data-[variant=line]/tabs-list:text-muted-foreground group-data-[variant=line]/tabs-list:hover:text-foreground group-data-[variant=line]/tabs-list:data-active:bg-transparent group-data-[variant=line]/tabs-list:data-active:font-bold group-data-[variant=line]/tabs-list:data-active:text-fg-default",
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
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
