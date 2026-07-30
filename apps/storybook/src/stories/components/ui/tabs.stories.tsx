import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, within } from "storybook/test"

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/ui/tabs"

const meta = {
  title: "Components/UI/Tabs",
  parameters: {
    layout: "padded",
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => <LearningProgressTabs />,
}

export const Line: Story = {
  render: () => (
    <Tabs className="w-[400px]" defaultValue="overview">
      <TabsList variant="line">
        <TabsTrigger value="overview">개요</TabsTrigger>
        <TabsTrigger value="lessons">레슨</TabsTrigger>
        <TabsTrigger value="notes">노트</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">코스 개요</TabsContent>
      <TabsContent value="lessons">레슨 목록</TabsContent>
      <TabsContent value="notes">학습 노트</TabsContent>
    </Tabs>
  ),
}

export const Vertical: Story = {
  render: () => (
    <Tabs className="w-[320px]" defaultValue="account" orientation="vertical">
      <TabsList>
        <TabsTrigger value="account">계정</TabsTrigger>
        <TabsTrigger value="password">비밀번호</TabsTrigger>
        <TabsTrigger value="notifications">알림</TabsTrigger>
      </TabsList>
      <TabsContent value="account">계정 설정</TabsContent>
      <TabsContent value="password">비밀번호 변경</TabsContent>
      <TabsContent value="notifications">알림 설정</TabsContent>
    </Tabs>
  ),
}

export const KeyboardInteraction: Story = {
  render: () => <LearningProgressTabs />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const completedTab = canvas.getByRole("tab", { name: "완료" })

    completedTab.focus()
    await userEvent.keyboard("{Enter}")
    await expect(completedTab).toHaveAttribute("aria-selected", "true")
    await expect(canvas.getByText("완료한 학습 목록")).toBeVisible()
  },
}

function LearningProgressTabs() {
  return (
    <Tabs className="w-[400px]" defaultValue="in_progress">
      <TabsList>
        <TabsTrigger value="in_progress">진행중</TabsTrigger>
        <TabsTrigger value="completed">완료</TabsTrigger>
      </TabsList>
      <TabsContent value="in_progress">진행 중인 학습 목록</TabsContent>
      <TabsContent value="completed">완료한 학습 목록</TabsContent>
    </Tabs>
  )
}
