import type { ComponentProps } from "react"

import {
  ListBoxItem,
  ListBoxItemIndicator,
  ListBoxItemRoot,
  ListBoxRoot,
  ListBoxSection,
  ListBoxSectionRoot,
} from "./list-box"

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const ListBox = Object.assign(ListBoxRoot, {
  Root: ListBoxRoot,
  Item: ListBoxItem,
  ItemIndicator: ListBoxItemIndicator,
  Section: ListBoxSection,
})

export type ListBox = {
  Props: ComponentProps<typeof ListBoxRoot>
  RootProps: ComponentProps<typeof ListBoxRoot>
  ItemProps: ComponentProps<typeof ListBoxItemRoot>
  SectionProps: ComponentProps<typeof ListBoxSectionRoot>
}

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {
  ListBoxRoot,
  ListBoxItem,
  ListBoxItemRoot,
  ListBoxItemIndicator,
  ListBoxSection,
  ListBoxSectionRoot,
}

export type {
  ListBoxRootProps,
  ListBoxRootProps as ListBoxProps,
  ListBoxItemProps,
  ListBoxItemRootProps,
  ListBoxItemIndicatorProps,
  ListBoxSectionProps,
  ListBoxSectionRootProps,
} from "./list-box"

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {
  listboxVariants,
  listboxItemVariants,
  listboxSectionVariants,
} from "./list-box.styles"
export type {
  ListBoxVariants,
  ListBoxItemVariants,
  ListBoxSectionVariants,
} from "./list-box.styles"
