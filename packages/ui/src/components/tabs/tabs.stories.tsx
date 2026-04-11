import type { Meta, StoryObj } from "@storybook/react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs"

const meta: Meta<typeof Tabs> = {
  title: "Components/Tabs",
  component: Tabs,
}

export default meta
type Story = StoryObj<typeof Tabs>

export const Primary: Story = {
  render: () => (
    <Tabs defaultValue="tab1" className="w-80">
      <TabsList variant="primary">
        <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        <TabsTrigger value="tab3">Tab 3</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">Tab 1 content</TabsContent>
      <TabsContent value="tab2">Tab 2 content</TabsContent>
      <TabsContent value="tab3">Tab 3 content</TabsContent>
    </Tabs>
  ),
}

export const Secondary: Story = {
  render: () => (
    <Tabs defaultValue="tab1" className="w-80">
      <TabsList variant="secondary">
        <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        <TabsTrigger value="tab3">Tab 3</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">Tab 1 content</TabsContent>
      <TabsContent value="tab2">Tab 2 content</TabsContent>
      <TabsContent value="tab3">Tab 3 content</TabsContent>
    </Tabs>
  ),
}

export const TwoTabs: Story = {
  render: () => (
    <Tabs defaultValue="progress" className="w-80">
      <TabsList variant="primary">
        <TabsTrigger value="progress">진행 중</TabsTrigger>
        <TabsTrigger value="completed">완료</TabsTrigger>
      </TabsList>
      <TabsContent value="progress">진행 중인 여정 목록</TabsContent>
      <TabsContent value="completed">완료한 여정 목록</TabsContent>
    </Tabs>
  ),
}
