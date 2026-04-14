import type { VariantProps } from "@workspace/ui/utils/tv"

import { tv } from "@workspace/ui/utils/tv"

export const breadcrumbsVariants = tv({
  slots: {
    base: "breadcrumbs",
    item: "breadcrumbs__item",
    link: "breadcrumbs__link",
    separator: "breadcrumbs__separator",
  },
})

export type BreadcrumbsVariants = VariantProps<typeof breadcrumbsVariants>
