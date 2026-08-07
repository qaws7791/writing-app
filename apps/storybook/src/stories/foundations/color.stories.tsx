import type { Meta, StoryObj } from "@storybook/react-vite"

import { ContrastPairCard } from "./color/contrast-pair-card"
import { OverviewPanel, SemanticTokenGroups } from "./color/overview-panel"
import { contrastPairs } from "./color/token-data"

const meta = {
  title: "Foundations/Color",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "글결 semantic color 토큰의 역할, 사용 규칙, 대비 검증을 제공하는 파운데이션 문서다. toolbar theme 전환 시 스와치와 대비 수치가 함께 갱신된다.",
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Overview: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "제품 색상 규칙과 역할 그룹 요약을 먼저 읽고, 대표 토큰 미리보기로 전체 페이지 흐름을 확인한다.",
      },
    },
  },
  render: () => <OverviewPanel />,
}

export const SemanticTokens: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "foundations.md Semantic Color 표와 1:1인 전체 토큰을 역할 그룹별로 나열한다. 토큰명 복사와 해석된 hex를 함께 제공한다.",
      },
    },
  },
  render: () => <SemanticTokenGroups />,
}

export const ContrastPairs: Story = {
  tags: ["ci-test"],
  parameters: {
    docs: {
      description: {
        story:
          "bg/fg semantic pair를 실제 UI 샘플과 WCAG 대비비로 검증한다. 라이트·다크 theme에서 수치가 달라지는지 확인한다.",
      },
    },
  },
  render: () => (
    <div className="grid max-w-5xl gap-4">
      {contrastPairs.map((pair) => (
        <ContrastPairCard key={pair.role} pair={pair} />
      ))}
    </div>
  ),
}
