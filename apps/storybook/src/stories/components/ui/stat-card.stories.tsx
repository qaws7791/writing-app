import type { Meta, StoryObj } from "@storybook/react-vite"
import { BookOpen } from "lucide-react"

import { StatCard, StatGrid } from "@workspace/ui/components/ui/stat-card"

const meta = {
  title: "Components/UI/StatCard",
  component: StatCard,
  args: {
    label: "콘텐츠",
    value: "42",
  },
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof StatCard>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const WithIconAndDetail: Story = {
  args: {
    detail: "활성 강의 8개",
    icon: <BookOpen aria-hidden="true" size={18} />,
  },
}

export const Layouts: Story = {
  render: () => (
    <div className="grid gap-4">
      {(["metric", "compact", "profile"] as const).map((layout) => (
        <StatCard
          detail="최근 7일 활성 42명"
          icon={<BookOpen aria-hidden="true" size={18} />}
          key={layout}
          label={layout}
          layout={layout}
          value="1,230"
        />
      ))}
    </div>
  ),
}

export const Grid: Story = {
  render: () => (
    <StatGrid aria-label="주요 지표">
      <StatCard
        detail="활성 강의 8개"
        icon={<BookOpen aria-hidden="true" size={18} />}
        label="콘텐츠"
        value="42"
      />
      <StatCard detail="최근 7일 활성 42명" label="총 사용자" value="1,230" />
      <StatCard detail="오늘 3명" label="신규 가입" value="+18" />
      <StatCard detail="누적 완료 수" label="완료 레슨" value="8,420" />
    </StatGrid>
  ),
}

export const LongContent: Story = {
  args: {
    detail:
      "지표 설명이 길어져도 값과 라벨의 위치는 유지되고 카드 밖으로 넘치지 않는다.",
    label: "승인 대기 중인 코스 변경 요청 수",
    value: "1,204,930",
  },
}
