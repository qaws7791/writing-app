import type { VariantProps } from "@workspace/ui/utils/tv"

import { tv } from "@workspace/ui/utils/tv"

export const toggleButtonVariants = tv({
  base: "toggle-button",
  defaultVariants: {
    isIconOnly: false,
    size: "md",
    variant: "default",
  },
  variants: {
    isIconOnly: {
      false: "",
      true: "toggle-button--icon-only",
    },
    size: {
      lg: "toggle-button--lg",
      md: "toggle-button--md",
      sm: "toggle-button--sm",
    },
    variant: {
      default: "toggle-button--default",
      ghost: "toggle-button--ghost",
    },
  },
})

export type ToggleButtonVariants = VariantProps<typeof toggleButtonVariants>
