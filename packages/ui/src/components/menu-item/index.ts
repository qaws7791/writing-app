import {
  MenuItemRoot,
  MenuItemIndicator,
  MenuItemSubmenuIndicator,
} from "./menu-item"

export const MenuItem = Object.assign(MenuItemRoot, {
  Root: MenuItemRoot,
  Indicator: MenuItemIndicator,
  SubmenuIndicator: MenuItemSubmenuIndicator,
})

export { menuItemVariants } from "./menu-item.styles"
export type { MenuItemVariants } from "./menu-item.styles"
export type {
  MenuItemRootProps,
  MenuItemIndicatorProps,
  MenuItemSubmenuIndicatorProps,
} from "./menu-item"

export { MenuItemRoot, MenuItemIndicator, MenuItemSubmenuIndicator }
