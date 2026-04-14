import type { VariantProps } from "@workspace/ui/utils/tv"

import { tv } from "@workspace/ui/utils/tv"

export const tableVariants = tv({
  defaultVariants: {
    variant: "primary",
  },
  slots: {
    base: "table-root",
    body: "table__body",
    cell: "table__cell",
    column: "table__column",
    columnResizer: "table__column-resizer",
    content: "table__content",
    footer: "table__footer",
    header: "table__header",
    loadMore: "table__load-more",
    loadMoreContent: "table__load-more-content",
    resizableContainer: "table__resizable-container",
    row: "table__row",
    scrollContainer: "table__scroll-container",
  },
  variants: {
    variant: {
      primary: {
        base: "table-root--primary",
      },
      secondary: {
        base: "table-root--secondary",
      },
    },
  },
})

export type TableVariants = VariantProps<typeof tableVariants>
