import type { Meta, StoryObj } from "@storybook/react-vite"

import { Progress, ProgressLabel, ProgressValue } from "@workspace/ui"

import { KeyboardTable } from "../../../blocks/keyboard-table"

const meta = {
  title: "Components/Feedback/Progress",
  component: Progress,
  args: {
    value: 50,
  },
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof Progress>

export default meta
type Story = StoryObj<typeof meta>

export const VariantsAndSizes: Story = {
  render: () => (
    <div className="grid max-w-xl gap-5">
      <Progress value={32}>
        <ProgressLabel>기본</ProgressLabel>
        <ProgressValue />
      </Progress>
      <Progress className="[&_[data-slot=progress-track]]:h-2" value={64}>
        <ProgressLabel>낮은 트랙</ProgressLabel>
        <ProgressValue />
      </Progress>
      <Progress className="[&_[data-slot=progress-track]]:h-4" value={86}>
        <ProgressLabel>강조 트랙</ProgressLabel>
        <ProgressValue />
      </Progress>
    </div>
  ),
}

export const BoundaryStates: Story = {
  render: () => (
    <div className="grid max-w-xl gap-5">
      {[0, 1, 99, 100].map((value) => (
        <Progress key={value} value={value}>
          <ProgressLabel>{value}% 상태</ProgressLabel>
          <ProgressValue />
        </Progress>
      ))}
    </div>
  ),
}

export const LabelsAndLongContent: Story = {
  render: () => (
    <Progress className="max-w-xl" value={47}>
      <ProgressLabel>
        아주 긴 레슨 제목을 가진 과정의 현재 작성 완료율
      </ProgressLabel>
      <ProgressValue />
    </Progress>
  ),
}

export const Accessibility: Story = {
  render: () => (
    <div className="grid max-w-3xl gap-6">
      <Progress aria-label="전체 코스 진행률" value={58}>
        <ProgressLabel>전체 코스 진행률</ProgressLabel>
        <ProgressValue />
      </Progress>
      <KeyboardTable
        rows={[
          {
            action: "progressbar 역할과 현재 값을 함께 전달한다.",
            keyName: "Screen reader",
          },
          {
            action: "시각 라벨 또는 aria-label 중 하나를 반드시 제공한다.",
            keyName: "Label",
          },
        ]}
      />
    </div>
  ),
}
