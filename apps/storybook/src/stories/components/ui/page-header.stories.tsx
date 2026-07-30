import type { Meta, StoryObj } from "@storybook/react-vite"

import { Button } from "@workspace/ui/components/ui/button"
import { PageHeader } from "@workspace/ui/components/ui/page-header"

const meta = {
  title: "Components/UI/PageHeader",
  component: PageHeader,
  args: {
    title: "콘텐츠 관리",
  },
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof PageHeader>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const WithDescriptionAndActions: Story = {
  args: {
    actions: <Button>새 코스</Button>,
    description: "코스를 확인하고 새 강의를 생성하거나 보관합니다.",
  },
}

export const LongContent: Story = {
  args: {
    actions: (
      <>
        <Button variant="outline">가져오기</Button>
        <Button>새 코스</Button>
      </>
    ),
    description:
      "제목과 설명이 길어져도 액션 영역은 오른쪽에 고정되고, 좁은 화면에서는 제목 아래로 내려간다.",
    title: "관리자가 확인해야 하는 콘텐츠 운영 현황과 승인 대기 항목",
  },
}
