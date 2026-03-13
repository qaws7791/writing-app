"use client"

import { Toolbar as ToolbarPrimitive } from "@base-ui/react/toolbar"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"
import { buttonVariants } from "@workspace/ui/components/button"

const toolbarVariants = cva(
  "inline-flex w-fit max-w-full shrink-0 items-center gap-1 rounded-xl border border-border/70 bg-background/95 p-1 shadow-xs supports-[backdrop-filter]:bg-background/85",
  {
    variants: {
      orientation: {
        horizontal: "flex-row",
        vertical: "flex-col items-stretch",
      },
    },
    defaultVariants: {
      orientation: "horizontal",
    },
  }
)

const toolbarGroupVariants = cva(
  "inline-flex items-center gap-1 rounded-lg bg-muted/50 p-0.5 data-[disabled]:opacity-50",
  {
    variants: {
      orientation: {
        horizontal: "flex-row",
        vertical: "flex-col items-stretch",
      },
    },
    defaultVariants: {
      orientation: "horizontal",
    },
  }
)

const toolbarInputVariants = cva(
  "h-8 min-w-24 rounded-md border border-transparent bg-transparent px-2.5 text-sm text-foreground shadow-none transition-[border-color,background-color,box-shadow,color] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:bg-background focus-visible:ring-3 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"
)

function Toolbar({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof ToolbarPrimitive.Root> &
  VariantProps<typeof toolbarVariants>) {
  return (
    <ToolbarPrimitive.Root
      data-slot="toolbar"
      orientation={orientation}
      className={cn(toolbarVariants({ orientation }), className)}
      {...props}
    />
  )
}

function ToolbarButton({
  className,
  variant = "ghost",
  size = "sm",
  ...props
}: React.ComponentProps<typeof ToolbarPrimitive.Button> &
  VariantProps<typeof buttonVariants>) {
  return (
    <ToolbarPrimitive.Button
      data-slot="toolbar-button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}

function ToolbarLink({
  className,
  variant = "ghost",
  size = "sm",
  ...props
}: React.ComponentProps<typeof ToolbarPrimitive.Link> &
  VariantProps<typeof buttonVariants>) {
  return (
    <ToolbarPrimitive.Link
      data-slot="toolbar-link"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}

function ToolbarInput({
  className,
  ...props
}: React.ComponentProps<typeof ToolbarPrimitive.Input>) {
  return (
    <ToolbarPrimitive.Input
      data-slot="toolbar-input"
      className={cn(toolbarInputVariants(), className)}
      {...props}
    />
  )
}

function ToolbarGroup({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof ToolbarPrimitive.Group> &
  VariantProps<typeof toolbarGroupVariants>) {
  return (
    <ToolbarPrimitive.Group
      data-slot="toolbar-group"
      className={cn(toolbarGroupVariants({ orientation }), className)}
      {...props}
    />
  )
}

function ToolbarSeparator({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof ToolbarPrimitive.Separator>) {
  return (
    <ToolbarPrimitive.Separator
      data-slot="toolbar-separator"
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border/80 data-horizontal:my-1 data-horizontal:h-px data-horizontal:w-full data-vertical:mx-1 data-vertical:h-6 data-vertical:w-px",
        className
      )}
      {...props}
    />
  )
}

export {
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarInput,
  ToolbarLink,
  ToolbarSeparator,
  toolbarGroupVariants,
  toolbarInputVariants,
  toolbarVariants,
}
