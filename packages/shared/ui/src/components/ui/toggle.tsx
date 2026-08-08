"use client"

import { Toggle as TogglePrimitive } from "@base-ui/react/toggle"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "#ui/lib/utils"

const toggleVariants = cva(
  "group/toggle squircle inline-flex items-center justify-center gap-1 rounded-2xl border border-transparent bg-clip-padding text-sm font-medium tracking-[-0.005em] whitespace-nowrap text-muted-foreground transition-[background-color,border-color,color,box-shadow] outline-none select-none hover:bg-accent/70 hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25 disabled:pointer-events-none disabled:opacity-45 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 aria-pressed:bg-accent aria-pressed:text-accent-foreground dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-disabled:pointer-events-none data-disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline: "border-border bg-card shadow-2xs hover:bg-accent/60",
      },
      size: {
        default:
          "h-10 min-w-10 px-4.5 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        sm: "h-9 min-w-9 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        lg: "h-12 min-w-12 px-5.5 has-data-[icon=inline-end]:pr-4.5 has-data-[icon=inline-start]:pl-4.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Toggle({
  className,
  variant = "default",
  size = "default",
  ...props
}: TogglePrimitive.Props & VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Toggle, toggleVariants }
