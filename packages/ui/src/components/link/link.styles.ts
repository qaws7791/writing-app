import type { VariantProps } from "@workspace/ui/utils/tv"

import { tv } from "@workspace/ui/utils/tv"

export const linkVariants = tv({
  slots: {
    base: "link",
    icon: "link__icon",
  },
})

type LinkRenderPropsKeys =
  | "isCurrent"
  | "isHovered"
  | "isPressed"
  | "isFocused"
  | "isFocusVisible"
  | "isDisabled"

export type LinkVariants = Omit<
  VariantProps<typeof linkVariants>,
  LinkRenderPropsKeys
>
