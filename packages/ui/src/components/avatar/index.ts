import type { ComponentProps } from "react"

import { AvatarFallback, AvatarImage, AvatarRoot } from "./avatar"

export const Avatar = Object.assign(AvatarRoot, {
  Root: AvatarRoot,
  Image: AvatarImage,
  Fallback: AvatarFallback,
})

export type Avatar = {
  Props: ComponentProps<typeof AvatarRoot>
  RootProps: ComponentProps<typeof AvatarRoot>
  ImageProps: ComponentProps<typeof AvatarImage>
  FallbackProps: ComponentProps<typeof AvatarFallback>
}

export { AvatarRoot, AvatarImage, AvatarFallback }
export type {
  AvatarRootProps,
  AvatarRootProps as AvatarProps,
  AvatarImageProps,
  AvatarFallbackProps,
} from "./avatar"
export { avatarVariants } from "./avatar.styles"
export type { AvatarVariants } from "./avatar.styles"
