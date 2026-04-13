import type { MenuItemRoot } from "@workspace/ui/components/menu-item"
import type { MenuSectionRoot } from "@workspace/ui/components/menu-section"
import type { ComponentProps } from "react"

import { MenuItem, MenuItemIndicator } from "@workspace/ui/components/menu-item"
import { MenuSectionRoot as MenuSection } from "@workspace/ui/components/menu-section"

import { MenuRoot } from "./menu"

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Menu = Object.assign(MenuRoot, {
  Root: MenuRoot,
  Item: MenuItem,
  ItemIndicator: MenuItemIndicator,
  Section: MenuSection,
})

export type Menu<T extends object = object> = {
  Props: ComponentProps<typeof MenuRoot<T>>
  RootProps: ComponentProps<typeof MenuRoot<T>>
  ItemProps: ComponentProps<typeof MenuItemRoot>
  SectionProps: ComponentProps<typeof MenuSectionRoot>
}

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export { MenuRoot }

export type { MenuRootProps, MenuRootProps as MenuProps } from "./menu"

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { menuVariants } from "./menu.styles"

export type { MenuVariants } from "./menu.styles"
