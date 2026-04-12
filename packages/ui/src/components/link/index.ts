import type { ComponentProps } from "react"

import { LinkIcon, LinkRoot } from "./link"

export const Link = Object.assign(LinkRoot, {
  Root: LinkRoot,
  Icon: LinkIcon,
})

export type Link = {
  Props: ComponentProps<typeof LinkRoot>
  RootProps: ComponentProps<typeof LinkRoot>
  IconProps: ComponentProps<typeof LinkIcon>
}

export { LinkRoot, LinkIcon }
export type {
  LinkRootProps,
  LinkIconProps,
  LinkRootProps as LinkProps,
} from "./link"
export { linkVariants } from "./link.styles"
export type { LinkVariants } from "./link.styles"
