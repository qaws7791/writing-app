import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "#ui/lib/utils"

const buttonVariantClasses = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-4xl border border-transparent bg-clip-padding whitespace-nowrap outline-none select-none [transition:transform_var(--motion-duration-normal)_var(--motion-ease-press),background-color_var(--motion-duration-normal),border-color_var(--motion-duration-normal),color_var(--motion-duration-normal)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&:active:not(:disabled):not([aria-haspopup='true']):not([aria-expanded='true'])]:[transform:scale(var(--motion-press-scale))] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-charcoal text-cream hover:opacity-90",
        solid: "bg-charcoal text-cream hover:opacity-90",
        outline:
          "border border-border bg-transparent text-charcoal hover:bg-surface aria-expanded:bg-surface",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-surface-hover aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "bg-transparent text-muted-foreground hover:bg-surface hover:text-foreground aria-expanded:bg-surface",
        destructive:
          "bg-coral-light text-charcoal hover:opacity-90 focus-visible:ring-coral-light/30",
        link: "text-primary underline-offset-4 hover:underline",
        correct:
          "bg-mint-light text-charcoal hover:opacity-90 focus-visible:ring-mint-light/30",
        wrong:
          "bg-coral-light text-charcoal hover:opacity-90 focus-visible:ring-coral-light/30",
        white: "bg-cream text-charcoal hover:bg-surface",
        ink: "bg-ink text-white hover:opacity-90 focus-visible:ring-ink/30",
      },
      size: {
        default: "h-11 px-5 py-2.5 gap-2 font-bold text-base",
        sm: "h-8 gap-1 px-3",
        lg: "h-14 px-7 py-4 font-bold text-body-lg gap-2",
        extra: "h-16 px-8 py-5 font-bold text-body-lg gap-2",
        icon: "size-10",
        "icon-xs": "size-8 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9",
        "icon-lg": "size-14",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type ButtonVariantsProps = NonNullable<
  Parameters<typeof buttonVariantClasses>[0]
>

function buttonVariants(props?: ButtonVariantsProps): string {
  return cn(buttonVariantClasses(props))
}

/**
 * `Button` 컴포넌트는 사용자가 클릭할 수 있는 버튼을 나타냅니다.
 *
 * @example
 * ```tsx
 * <Button>Click me</Button>
 * ```
 */
function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariantClasses>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={buttonVariants({ variant, size, className })}
      {...props}
    />
  )
}

export { Button, buttonVariants }
