import type { Meta, StoryObj } from "@storybook/react-vite"

import { Button } from "@workspace/ui/components/ui/button"
import { SectionHeader } from "@workspace/ui/components/ui/section-header"

const meta = {
  title: "Components/UI/SectionHeader",
  component: SectionHeader,
  args: {
    title: "코스 목록",
  },
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof SectionHeader>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const WithDescription: Story = {
  args: {
    description: "총 3개 · 1/1 페이지",
  },
}

export const WithActions: Story = {
  args: {
    actions: (
      <>
        <Button size="sm" variant="outline">
          내보내기
        </Button>
        <Button size="sm">레슨 추가</Button>
      </>
    ),
    description: "유닛 안에서 레슨 순서를 조정할 수 있다.",
  },
}
