import type { VariantProps } from "@workspace/ui/utils/tv"

import { tv } from "@workspace/ui/utils/tv"

export const tabsVariants = tv({
  defaultVariants: {
    variant: "primary",
  },
  slots: {
    base: "tabs",
    separator: "tabs__separator",
    tab: "tabs__tab",
    tabIndicator: "tabs__indicator",
    tabList: "tabs__list",
    tabListContainer: "tabs__list-container",
    tabPanel: "tabs__panel",
  },
  variants: {
    variant: {
      primary: {},
      secondary: {
        base: "tabs--secondary",
      },
    },
  },
})

type TabsRenderPropsKeys = "selectedKey"

export type TabsVariants = Omit<
  VariantProps<typeof tabsVariants>,
  TabsRenderPropsKeys
>
