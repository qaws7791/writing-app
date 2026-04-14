import type { ComponentProps } from "react"

import { BreadcrumbsRoot, BreadcrumbsItem } from "./breadcrumbs"

export const Breadcrumbs = Object.assign(BreadcrumbsRoot, {
  Root: BreadcrumbsRoot,
  Item: BreadcrumbsItem,
})

export type Breadcrumbs = {
  Props: ComponentProps<typeof BreadcrumbsRoot>
  RootProps: ComponentProps<typeof BreadcrumbsRoot>
  ItemProps: ComponentProps<typeof BreadcrumbsItem>
}

export { BreadcrumbsRoot, BreadcrumbsItem }
export type { BreadcrumbsRootProps, BreadcrumbsItemProps } from "./breadcrumbs"
export { breadcrumbsVariants } from "./breadcrumbs.styles"
export type { BreadcrumbsVariants } from "./breadcrumbs.styles"
