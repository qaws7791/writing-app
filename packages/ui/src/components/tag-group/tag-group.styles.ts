import type { VariantProps } from "@workspace/ui/utils/tv"

import { tv } from "@workspace/ui/utils/tv"

export const tagGroupVariants = tv({
  slots: {
    base: "tag-group",
    list: "tag-group__list",
  },
})

export type TagGroupVariants = VariantProps<typeof tagGroupVariants>
