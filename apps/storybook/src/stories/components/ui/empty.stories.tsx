import type { Meta, StoryObj } from "@storybook/react-vite"
import { SearchX } from "lucide-react"

import { Button } from "@workspace/ui/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/ui/empty"

const meta = {
  title: "Components/UI/Empty",
  component: Empty,
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof Empty>

export default meta
type Story = StoryObj<typeof meta>

export const Anatomy: Story = {
  render: () => (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>표시할 항목이 없습니다</EmptyTitle>
        <EmptyDescription>필터를 조정해 다시 확인하세요.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline">필터 초기화</Button>
      </EmptyContent>
    </Empty>
  ),
}

export const WithMedia: Story = {
  tags: ["ci-test"],
  render: () => (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchX aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>검색 결과가 없습니다</EmptyTitle>
        <EmptyDescription>
          다른 검색어를 입력하거나 상태 필터를 넓혀보세요.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline">검색어 지우기</Button>
      </EmptyContent>
    </Empty>
  ),
}

export const TitleOnly: Story = {
  render: () => (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>아직 등록한 코스가 없습니다</EmptyTitle>
      </EmptyHeader>
    </Empty>
  ),
}
