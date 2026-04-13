import { ListBoxItem, ListBoxRoot } from "./list-box"

export const ListBox = Object.assign(ListBoxRoot, {
  Root: ListBoxRoot,
  Item: ListBoxItem,
})

export { ListBoxRoot, ListBoxItem } from "./list-box"
export type {
  ListBoxRootProps,
  ListBoxRootProps as ListBoxProps,
  ListBoxItemProps,
} from "./list-box"
export { listBoxVariants, listBoxItemVariants } from "./list-box.styles"
export type { ListBoxVariants, ListBoxItemVariants } from "./list-box.styles"
