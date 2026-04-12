import type { ComponentProps } from "react"

import { ToolbarRoot } from "./toolbar"

export const Toolbar = Object.assign(ToolbarRoot, {
  Root: ToolbarRoot,
})

export type Toolbar = {
  Props: ComponentProps<typeof ToolbarRoot>
  RootProps: ComponentProps<typeof ToolbarRoot>
}

export { ToolbarRoot } from "./toolbar"
export type {
  ToolbarRootProps,
  ToolbarRootProps as ToolbarProps,
} from "./toolbar"
export { toolbarVariants } from "./toolbar.styles"
export type { ToolbarVariants } from "./toolbar.styles"
