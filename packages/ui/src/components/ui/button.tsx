import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "group/button btn-squish inline-flex shrink-0 items-center justify-center rounded-4xl border border-transparent bg-clip-padding text-sm font-bold whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-charcoal text-cream hover:bg-charcoal/90",
        outline:
          "border-charcoal/12 bg-transparent text-charcoal hover:border-charcoal/24 hover:bg-surface aria-expanded:bg-surface aria-expanded:text-charcoal",
        secondary:
          "bg-surface text-charcoal hover:bg-surface-hover aria-expanded:bg-surface-hover aria-expanded:text-charcoal",
        ghost:
          "text-charcoal hover:bg-surface aria-expanded:bg-surface aria-expanded:text-charcoal",
        destructive:
          "bg-coral-light text-coral-dark hover:bg-coral focus-visible:border-coral-dark focus-visible:ring-coral/25",
        link: "rounded-md px-0 text-charcoal underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-11 gap-2 px-5 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        xs: "h-7 gap-1 rounded-2xl px-2.5 text-xs has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 rounded-3xl px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        lg: "h-12 gap-2 px-6 text-base has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5",
        icon: "size-11",
        "icon-xs": "size-7 rounded-2xl [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9 rounded-3xl",
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
