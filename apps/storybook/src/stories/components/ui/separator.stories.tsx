import type { Meta, StoryObj } from "@storybook/react-vite"

import { Separator } from "@workspace/ui/components/ui/separator"

const meta = {
  title: "Components/UI/Separator",
  component: Separator,
  args: {
    orientation: "horizontal",
  },
  argTypes: {
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
      description: "구분선의 방향(가로/세로)을 설정합니다.",
    },
  },
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Separator>

export default meta
type Story = StoryObj<typeof meta>

/**
 * 기본 Playground 스토리입니다.
 */
export const Playground: Story = {
  args: {
    className: "w-[300px]",
  },
}

/**
 * 가로 구분선(Horizontal)을 사용하는 가장 보편적인 예시입니다.
 * 제목 영역과 본문 텍스트 영역을 구분하는 용도로 사용됩니다.
 */
export const Horizontal: Story = {
  render: () => (
    <div className="w-[400px] rounded-lg border p-6 bg-card text-card-foreground shadow-sm">
      <div className="space-y-1">
        <h4 className="text-sm font-semibold leading-none">작성 학습 플랫폼</h4>
        <p className="text-sm text-muted-foreground">
          사용자의 글쓰기 역량 강화를 돕는 온라인 학습 시스템입니다.
        </p>
      </div>
      <Separator className="my-4" />
      <div className="flex h-5 items-center space-x-4 text-sm text-muted-foreground">
        <div>Next.js</div>
        <div>Storybook</div>
        <div>Shadcn UI</div>
      </div>
    </div>
  ),
}

/**
 * 세로 구분선(Vertical)을 사용하는 예시입니다.
 * 내비게이션 메뉴나 메타데이터 항목들을 좌우로 나열하고 구분하는 용도로 적합합니다.
 */
export const Vertical: Story = {
  render: () => (
    <div className="flex items-center space-x-4 text-sm font-medium">
      <span className="hover:text-primary cursor-pointer">대시보드</span>
      <Separator orientation="vertical" className="h-4" />
      <span className="hover:text-primary cursor-pointer">내 서재</span>
      <Separator orientation="vertical" className="h-4" />
      <span className="hover:text-primary cursor-pointer">학습 분석</span>
      <Separator orientation="vertical" className="h-4" />
      <span className="hover:text-primary cursor-pointer">설정</span>
    </div>
  ),
}

/**
 * 텍스트 레이아웃 및 여백 유틸리티와 조합하여 복합적으로 사용하는 시각적 가이드 예제입니다.
 */
export const CustomStyle: Story = {
  render: () => (
    <div className="w-[350px] p-4 bg-muted/40 rounded-lg space-y-4">
      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
        학습 과정 진도율
      </div>
      <div className="text-2xl font-bold">85% 완료</div>

      <Separator className="bg-primary/50" />

      <div className="grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground">
        <div>
          <span className="block font-semibold text-foreground text-sm">
            12
          </span>
          수행 완료
        </div>
        <div className="flex justify-center">
          <Separator orientation="vertical" className="h-8 bg-border" />
        </div>
        <div>
          <span className="block font-semibold text-foreground text-sm">2</span>
          진행 대기
        </div>
      </div>
    </div>
  ),
}
