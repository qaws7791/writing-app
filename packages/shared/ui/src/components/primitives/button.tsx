import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "#ui/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-2xl border bg-clip-padding text-sm font-medium tracking-[-0.005em] whitespace-nowrap transition-[background-color,border-color,color,box-shadow,scale] duration-125 ease-press outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25 active:not-aria-[haspopup]:scale-98 disabled:pointer-events-none disabled:opacity-45 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-xs hover:bg-primary/88 active:shadow-none",
        outline:
          "border-border bg-card text-foreground shadow-xs hover:bg-accent/60 active:shadow-none aria-expanded:bg-accent/60 dark:bg-card/60 dark:hover:bg-accent/50",
        secondary:
          "border-transparent bg-primary/10 text-primary hover:bg-primary/16 aria-expanded:bg-primary/16 dark:bg-primary/18 dark:hover:bg-primary/26 dark:aria-expanded:bg-primary/26",
        ghost:
          "border-transparent text-foreground/85 hover:bg-accent/70 hover:text-foreground aria-expanded:bg-accent/70 aria-expanded:text-foreground dark:hover:bg-accent/60",
        destructive:
          "border-transparent bg-destructive/10 text-destructive hover:bg-destructive/16 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/18 dark:hover:bg-destructive/26 dark:focus-visible:ring-destructive/40",
        success:
          "border-transparent bg-success text-background shadow-xs hover:bg-success/88 active:shadow-none focus-visible:border-success/40 focus-visible:ring-success/20 dark:focus-visible:ring-success/40",
        warning:
          "border-transparent bg-warning text-background shadow-xs hover:bg-warning/88 active:shadow-none focus-visible:border-warning/40 focus-visible:ring-warning/20 dark:focus-visible:ring-warning/40",
        link: "border-transparent text-foreground underline decoration-foreground/25 underline-offset-[0.3em] hover:decoration-foreground/70",
      },
      size: {
        default:
          "h-10 gap-2 px-5.5 has-data-[icon=inline-end]:pr-4.5 has-data-[icon=inline-start]:pl-4.5",
        xs: "h-7 gap-1 px-2.5 text-xs has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        lg: "h-12 gap-2.5 px-6.5 text-[0.9375rem] has-data-[icon=inline-end]:pr-5.5 has-data-[icon=inline-start]:pl-5.5",
        icon: "size-10",
        "icon-xs": "size-7 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9",
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
