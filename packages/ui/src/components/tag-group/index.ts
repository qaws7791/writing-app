import { TagGroupRoot, TagGroupList } from "./tag-group"

export const TagGroup = Object.assign(TagGroupRoot, {
  Root: TagGroupRoot,
  List: TagGroupList,
})

export { tagGroupVariants } from "./tag-group.styles"
export type { TagGroupVariants } from "./tag-group.styles"
export type { TagGroupRootProps, TagGroupListProps } from "./tag-group"
export { TagGroupRoot, TagGroupList, TagGroupContext } from "./tag-group"
