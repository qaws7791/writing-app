import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "group/button btn-squish inline-flex shrink-0 items-center justify-center rounded-control border border-transparent bg-clip-padding text-sm font-bold whitespace-nowrap transition-colors outline-none select-none focus-visible:border-border-focus focus-visible:ring-3 focus-visible:ring-border-focus/25 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-danger-fg aria-invalid:ring-3 aria-invalid:ring-danger-fg/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-action-primary-bg text-action-primary-fg hover:bg-action-primary-bg/90",
        solid:
          "bg-action-primary-bg text-action-primary-fg hover:bg-action-primary-bg/90",
        outline:
          "border-border-default bg-transparent text-fg-default hover:border-border-strong hover:bg-bg-surface aria-expanded:bg-bg-surface aria-expanded:text-fg-default",
        secondary:
          "bg-bg-surface text-fg-default hover:bg-bg-surface-hover aria-expanded:bg-bg-surface-hover aria-expanded:text-fg-default",
        ghost:
          "text-fg-muted hover:bg-bg-surface hover:text-fg-default aria-expanded:bg-bg-surface aria-expanded:text-fg-default",
        correct:
          "bg-success-bg text-fg-default hover:bg-success-bg/90 focus-visible:border-success-fg focus-visible:ring-success-fg/25",
        wrong:
          "bg-danger-bg text-fg-default hover:bg-danger-bg/90 focus-visible:border-danger-fg focus-visible:ring-danger-fg/25",
        white: "bg-bg-canvas text-fg-default hover:bg-bg-surface",
        destructive:
          "bg-danger-bg text-danger-fg hover:bg-coral focus-visible:border-danger-fg focus-visible:ring-danger-fg/25",
        link: "rounded-md px-0 text-fg-default underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-11 gap-2 px-5 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        xs: "h-7 gap-1 rounded-2xl px-2.5 text-xs has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 rounded-control px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        lg: "min-h-12 gap-2 rounded-4xl px-6 py-5 text-lg leading-none has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5",
        icon: "size-11",
        "icon-xs": "size-7 rounded-2xl [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9 rounded-control",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
