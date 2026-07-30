import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { Play, RotateCcw } from "lucide-react"
import { expect, within } from "storybook/test"

import { Button } from "@workspace/ui/components/ui/button"
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@workspace/ui/components/ui/progress"
import { Surface } from "@workspace/ui/components/ui/surface"

const meta = {
  title: "Components/UI/Progress",
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

/**
 * 기본 Playground 스토리입니다. 컨트롤을 사용하여 직접 속성을 테스트할 수 있습니다.
 */
export const Playground: Story = {
  args: {
    value: 60,
    className: "max-w-xl",
    children: (
      <>
        <ProgressLabel>진행 상태</ProgressLabel>
        <ProgressValue />
      </>
    ),
  },
}

/**
 * 트랙의 높이(Size)나 클래스 조작을 통해 크기를 조정한 예제입니다.
 */
export const VariantsAndSizes: Story = {
  render: () => (
    <div className="grid max-w-xl gap-6">
      <Progress value={32}>
        <ProgressLabel>기본 (Default)</ProgressLabel>
        <ProgressValue />
      </Progress>
      <Progress className="[&_[data-slot=progress-track]]:h-1.5" value={64}>
        <ProgressLabel>낮은 트랙 (h-1.5)</ProgressLabel>
        <ProgressValue />
      </Progress>
      <Progress className="[&_[data-slot=progress-track]]:h-4" value={86}>
        <ProgressLabel>두꺼운 트랙 (h-4)</ProgressLabel>
        <ProgressValue />
      </Progress>
    </div>
  ),
}

/**
 * Surface 패널 위 0% 진행률에서도 빈 트랙이 보이는지 검증하는 스토리입니다.
 */
export const EmptyTrackOnSurface: Story = {
  render: () => (
    <Surface className="max-w-xl rounded-4xl p-8" variant="panel">
      <Progress
        aria-label="글쓰기 첫걸음 30일 진행률"
        className="items-center gap-3"
        indicatorClassName="bg-primary"
        value={0}
      >
        <span className="shrink-0 text-label-sm font-bold text-muted-foreground">
          0/10
        </span>
      </Progress>
    </Surface>
  ),
}

/**
 * 극단값(0%, 100%) 및 경계 상태에서의 렌더링 검증 예제입니다.
 */
export const BoundaryStates: Story = {
  render: () => (
    <div className="grid max-w-xl gap-6">
      {[0, 1, 99, 100].map((value) => (
        <Progress key={value} value={value}>
          <ProgressLabel>{value}% 경계 상태</ProgressLabel>
          <ProgressValue />
        </Progress>
      ))}
    </div>
  ),
}

/**
 * 긴 타이틀이나 레이아웃이 밀리는 문제를 예방하기 위한 레이아웃 검증 스토리입니다.
 */
export const LabelsAndLongContent: Story = {
  render: () => (
    <Progress className="max-w-xl" value={47}>
      <ProgressLabel className="truncate max-w-[70%]">
        아주 긴 교과과정 제목 및 챕터 2: 데이터 기반 프로그레스 바 적용 시나리오
        테스트
      </ProgressLabel>
      <ProgressValue />
    </Progress>
  ),
}

/**
 * 진행 표시바와 트랙에 semantic 상태 토큰을 적용한 예제입니다.
 */
export const CustomColors: Story = {
  render: () => (
    <div className="grid max-w-xl gap-6">
      <Progress
        value={45}
        indicatorClassName="bg-success-fg"
        trackClassName="bg-success"
      >
        <ProgressLabel>완료 단계 (success 토큰)</ProgressLabel>
        <ProgressValue />
      </Progress>

      <Progress
        value={90}
        indicatorClassName="bg-warning"
        trackClassName="bg-warning-soft"
      >
        <ProgressLabel>주의 필요 상태 (warning 토큰)</ProgressLabel>
        <ProgressValue />
      </Progress>
    </div>
  ),
}

/**
 * 버튼으로 진행 상황을 직접 제어할 수 있는 대화형(Interactive) 예제입니다.
 */
export const Interactive: Story = {
  render: () => <ControlledProgress />,
}

/**
 * 스크린 리더가 progressbar 역할·현재 값·접근 이름을 함께 받는지 확인하는 스토리입니다.
 */
export const Accessibility: Story = {
  render: () => (
    <Progress aria-label="전체 코스 진행률" className="max-w-3xl" value={58}>
      <ProgressLabel>전체 코스 진행률</ProgressLabel>
      <ProgressValue />
    </Progress>
  ),
  play: async ({ canvasElement }) => {
    const progressbar = within(canvasElement).getByRole("progressbar", {
      name: "전체 코스 진행률",
    })

    await expect(progressbar).toHaveAttribute("aria-valuenow", "58")
  },
}

function ControlledProgress() {
  const [progress, setProgress] = useState(13)

  return (
    <div className="grid max-w-xl gap-4">
      <Progress value={progress}>
        <ProgressLabel>실시간 로딩 분석</ProgressLabel>
        <ProgressValue />
      </Progress>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setProgress((current) => Math.min(current + 10, 100))}
        >
          <Play data-icon="inline-start" />
          +10% 올리기
        </Button>
        <Button size="sm" variant="outline" onClick={() => setProgress(0)}>
          <RotateCcw data-icon="inline-start" />
          초기화
        </Button>
      </div>
    </div>
  )
}
