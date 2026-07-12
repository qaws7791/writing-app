import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { Play, RotateCcw } from "lucide-react"

import { Button } from "@workspace/ui/components/ui/button"
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@workspace/ui/components/ui/progress"

import { KeyboardTable } from "#storybook/blocks/keyboard-table"

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
 * 진행 표시바의 색상 및 배경 색상을 커스텀 클래스로 제어하는 복합 스타일 스토리입니다.
 */
export const CustomColors: Story = {
  render: () => (
    <div className="grid max-w-xl gap-6">
      <Progress
        value={45}
        indicatorClassName="bg-emerald-500"
        trackClassName="bg-emerald-100 dark:bg-emerald-950"
      >
        <ProgressLabel className="text-emerald-700 dark:text-emerald-300">
          완료 단계 (Success Theme)
        </ProgressLabel>
        <ProgressValue className="text-emerald-700 dark:text-emerald-300" />
      </Progress>

      <Progress
        value={90}
        indicatorClassName="bg-amber-500"
        trackClassName="bg-amber-100 dark:bg-amber-950"
      >
        <ProgressLabel className="text-amber-700 dark:text-amber-300">
          주의 필요 상태 (Warning Theme)
        </ProgressLabel>
        <ProgressValue className="text-amber-700 dark:text-amber-300" />
      </Progress>
    </div>
  ),
}

/**
 * 동적으로 진행 상황이 차오르거나 수동으로 상태를 제어할 수 있는 대화형(Interactive) 예제입니다.
 */
export const Interactive: Story = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [progress, setProgress] = React.useState(13)

    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useEffect(() => {
      const timer = setTimeout(() => {
        if (progress < 100) {
          setProgress((prev) => Math.min(prev + 1, 100))
        }
      }, 100)
      return () => clearTimeout(timer)
    }, [progress])

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
            onClick={() => setProgress((prev) => Math.min(prev + 10, 100))}
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
  },
}

/**
 * 스크린 리더 및 키보드 웹 접근성을 확인하기 위한 가이드 스토리입니다.
 */
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
