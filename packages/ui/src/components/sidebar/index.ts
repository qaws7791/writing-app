import type { ComponentProps } from "react"

import {
  SidebarBody,
  SidebarFooter,
  SidebarHeader,
  SidebarItem,
  SidebarRoot,
  SidebarSection,
} from "./sidebar"

export const Sidebar = Object.assign(SidebarRoot, {
  Root: SidebarRoot,
  Header: SidebarHeader,
  Body: SidebarBody,
  Footer: SidebarFooter,
  Item: SidebarItem,
  Section: SidebarSection,
})

export type Sidebar = {
  Props: ComponentProps<typeof SidebarRoot>
  RootProps: ComponentProps<typeof SidebarRoot>
  HeaderProps: ComponentProps<typeof SidebarHeader>
  BodyProps: ComponentProps<typeof SidebarBody>
  FooterProps: ComponentProps<typeof SidebarFooter>
  ItemProps: ComponentProps<typeof SidebarItem>
  SectionProps: ComponentProps<typeof SidebarSection>
}

export {
  SidebarRoot,
  SidebarHeader,
  SidebarBody,
  SidebarFooter,
  SidebarItem,
  SidebarSection,
}

export type {
  SidebarRootProps,
  SidebarHeaderProps,
  SidebarBodyProps,
  SidebarFooterProps,
} from "./sidebar"

export { sidebarVariants } from "./sidebar.styles"
export type { SidebarVariants } from "./sidebar.styles"
