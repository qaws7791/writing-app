import type { ComponentProps } from "react"

import {
  SwitchContent,
  SwitchControl,
  SwitchIcon,
  SwitchRoot,
  SwitchThumb,
} from "./switch"

export const Switch = Object.assign(SwitchRoot, {
  Root: SwitchRoot,
  Content: SwitchContent,
  Control: SwitchControl,
  Thumb: SwitchThumb,
  Icon: SwitchIcon,
})

export type Switch = {
  Props: ComponentProps<typeof SwitchRoot>
  RootProps: ComponentProps<typeof SwitchRoot>
  ContentProps: ComponentProps<typeof SwitchContent>
  ControlProps: ComponentProps<typeof SwitchControl>
  ThumbProps: ComponentProps<typeof SwitchThumb>
  IconProps: ComponentProps<typeof SwitchIcon>
}

export { SwitchRoot, SwitchContent, SwitchControl, SwitchIcon, SwitchThumb }
export type {
  SwitchRootProps,
  SwitchRootProps as SwitchProps,
  SwitchContentProps,
  SwitchControlProps,
  SwitchThumbProps,
  SwitchIconProps,
} from "./switch"
export { switchVariants } from "./switch.styles"
export type { SwitchVariants } from "./switch.styles"
