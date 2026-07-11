import type { Meta, StoryObj } from "@storybook/react-vite"
import { Loader2, Mail, Save, Trash2, ArrowRight } from "lucide-react"
import { expect, fn, userEvent, within } from "storybook/test"

import { Button } from "@workspace/ui"

const variants = [
  "default",
  "solid",
  "outline",
  "secondary",
  "ghost",
  "destructive",
  "link",
  "correct",
  "wrong",
  "white",
  "ink",
] as const

const sizes = [
  "sm",
  "default",
  "lg",
  "extra",
  "icon",
  "icon-sm",
  "icon-lg",
] as const

const meta = {
  title: "Components/UI/Button",
  component: Button,
  args: {
    children: "버튼",
    variant: "default",
    size: "default",
    onClick: fn(),
  },
  argTypes: {
    variant: {
      control: "select",
      options: variants,
      description: "버튼의 시각적 스타일 Variant를 지정합니다.",
    },
    size: {
      control: "select",
      options: sizes,
      description: "버튼의 크기 Size를 지정합니다.",
    },
    disabled: {
      control: "boolean",
      description: "버튼의 비활성화 여부를 설정합니다.",
    },
  },
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

/**
 * 기본 Playground 스토리입니다. 컨트롤을 사용하여 직접 속성을 테스트할 수 있습니다.
 */
export const Playground: Story = {
  args: {
    children: "기본 버튼",
  },
}

/**
 * 지원하는 모든 Variant 예제입니다.
 */
export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="default">Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
      <Button variant="correct">Correct</Button>
      <Button variant="wrong">Wrong</Button>
      <Button variant="white">White</Button>
      <Button variant="ink">Ink</Button>
      <Button variant="solid">Solid</Button>
    </div>
  ),
}

/**
 * 지원하는 모든 Size 예제입니다. (아이콘 크기 포함)
 */
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-end gap-3">
      <Button size="sm">Small (sm)</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large (lg)</Button>
      <Button size="icon-sm" aria-label="아이콘 SM">
        <Save aria-hidden="true" />
      </Button>
      <Button size="icon" aria-label="아이콘 기본">
        <Save aria-hidden="true" />
      </Button>
      <Button size="icon-lg" aria-label="아이콘 LG">
        <Save aria-hidden="true" />
      </Button>
    </div>
  ),
}

/**
 * 단독 아이콘 버튼 예제입니다.
 */
export const IconOnly: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="icon" aria-label="메일 아이콘" variant="outline">
        <Mail aria-hidden="true" />
      </Button>
      <Button size="icon" aria-label="삭제 아이콘" variant="destructive">
        <Trash2 aria-hidden="true" />
      </Button>
      <Button size="icon" aria-label="저장 아이콘">
        <Save aria-hidden="true" />
      </Button>
    </div>
  ),
}

/**
 * 텍스트와 아이콘을 결합하여 사용하는 예제입니다.
 * data-icon 속성이나 레이아웃 유틸리티를 활용하여 정렬을 맞출 수 있습니다.
 */
export const WithIcon: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button>
        <Mail data-icon="inline-start" />
        이메일로 로그인
      </Button>
      <Button variant="outline">
        다음 단계
        <ArrowRight data-icon="inline-end" />
      </Button>
      <Button variant="secondary">
        <Save data-icon="inline-start" />
        임시 저장
      </Button>
    </div>
  ),
}

/**
 * 작업이 진행 중임을 보여주는 로딩 상태 예제입니다.
 * disabled 처리와 spinner 애니메이션 아이콘이 포함됩니다.
 */
export const Loading: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button disabled>
        <Loader2 className="animate-spin" data-icon="inline-start" />
        불러오는 중...
      </Button>
      <Button variant="secondary" disabled>
        <Loader2 className="animate-spin" data-icon="inline-start" />
        저장 중...
      </Button>
      <Button aria-label="불러오는 중" size="icon" disabled variant="outline">
        <Loader2 className="animate-spin" aria-hidden="true" />
      </Button>
    </div>
  ),
}

/**
 * `render` 프로퍼티를 사용하여 다른 HTML 엘리먼트나 커스텀 컴포넌트(예: Next.js Link)로 렌더링하는 예제입니다.
 * base-ui의 Button Primitive는 `render` prop을 통해 다형성(polymorphism)을 지원합니다.
 */
export const AsChild: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        render={(props) => (
          <a
            {...props}
            href="https://google.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            링크로 렌더링 (a 태그)
          </a>
        )}
        variant="outline"
      />
      <Button
        render={(props) => (
          <div {...props} role="button">
            Div 엘리먼트로 렌더링
          </div>
        )}
        variant="secondary"
      />
    </div>
  ),
}

/**
 * 비활성화(disabled) 및 에러(aria-invalid) 등 다양한 상태를 시뮬레이션한 예제입니다.
 */
export const States: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button>Active State</Button>
      <Button disabled>Disabled State</Button>
      <Button aria-invalid="true" variant="outline">
        Invalid State (오류)
      </Button>
      <Button aria-invalid="true" variant="destructive">
        Invalid Destructive
      </Button>
    </div>
  ),
}

/**
 * 상호작용 및 클릭 이벤트 확인용 스토리입니다.
 */
export const Interaction: Story = {
  args: {
    children: "클릭 확인",
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole("button", { name: "클릭 확인" }))
    await expect(args.onClick).toHaveBeenCalled()
  },
}
