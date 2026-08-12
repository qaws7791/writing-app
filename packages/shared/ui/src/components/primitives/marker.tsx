import * as React from "react"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "#ui/lib/utils"

const markerVariants = cva(
  "group/marker relative flex min-h-4 w-full items-center gap-2 text-left text-sm leading-6 text-muted-foreground [&_svg:not([class*='size-'])]:size-4 [a]:underline [a]:decoration-muted-foreground/40 [a]:underline-offset-[0.3em] [a]:transition-colors [a]:hover:text-foreground [a]:hover:decoration-foreground/50",
  {
    variants: {
      variant: {
        default: "",
        separator:
          "text-xs font-medium tracking-[0.05em] uppercase before:mr-2.5 before:h-px before:min-w-0 before:flex-1 before:bg-border after:ml-2.5 after:h-px after:min-w-0 after:flex-1 after:bg-border",
        border: "border-b border-border/70 pb-2",
      },
    },
  }
)

function Marker({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"div"> & VariantProps<typeof markerVariants>) {
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(
      {
        className: cn(markerVariants({ variant, className })),
      },
      props
    ),
    render,
    state: {
      slot: "marker",
      variant,
    },
  })
}

function MarkerIcon({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="marker-icon"
      aria-hidden="true"
      className={cn(
        "size-4 shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function MarkerContent({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="marker-content"
      className={cn(
        "min-w-0 wrap-break-word group-data-[variant=separator]/marker:flex-none group-data-[variant=separator]/marker:text-center *:[a]:underline *:[a]:decoration-muted-foreground/40 *:[a]:underline-offset-[0.3em] *:[a]:transition-colors *:[a]:hover:text-foreground *:[a]:hover:decoration-foreground/50",
        className
      )}
      {...props}
    />
  )
}

export { Marker, MarkerIcon, MarkerContent, markerVariants }
