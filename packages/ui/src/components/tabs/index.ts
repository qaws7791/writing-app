import type { ComponentProps } from "react"

import {
  Tab,
  TabIndicator,
  TabList,
  TabListContainer,
  TabPanel,
  TabSeparator,
  TabsRoot,
} from "./tabs"

export const Tabs = Object.assign(TabsRoot, {
  Root: TabsRoot,
  ListContainer: TabListContainer,
  List: TabList,
  Tab,
  Indicator: TabIndicator,
  Separator: TabSeparator,
  Panel: TabPanel,
})

export type Tabs = {
  Props: ComponentProps<typeof TabsRoot>
  RootProps: ComponentProps<typeof TabsRoot>
  ListContainerProps: ComponentProps<typeof TabListContainer>
  ListProps: ComponentProps<typeof TabList>
  TabProps: ComponentProps<typeof Tab>
  IndicatorProps: ComponentProps<typeof TabIndicator>
  SeparatorProps: ComponentProps<typeof TabSeparator>
  PanelProps: ComponentProps<typeof TabPanel>
}

export {
  TabsRoot,
  TabListContainer,
  TabList,
  Tab,
  TabIndicator,
  TabSeparator,
  TabPanel,
}
export type {
  TabsRootProps,
  TabsRootProps as TabsProps,
  TabListContainerProps,
  TabListProps,
  TabProps,
  TabIndicatorProps,
  TabSeparatorProps,
  TabPanelProps,
} from "./tabs"
export { tabsVariants } from "./tabs.styles"
export type { TabsVariants } from "./tabs.styles"
