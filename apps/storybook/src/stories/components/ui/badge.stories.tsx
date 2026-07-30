import type { Meta, StoryObj } from "@storybook/react-vite"
import { AlertCircle, CheckCircle, Info, Star } from "lucide-react"

import { Badge } from "@workspace/ui/components/ui/badge"

const variants = [
  "default",
  "secondary",
  "destructive",
  "outline",
  "ghost",
  "link",
] as const

const tones = ["neutral", "success", "danger", "info", "selected"] as const

const meta = {
  title: "Components/UI/Badge",
  component: Badge,
  args: {
    children: "배지",
    variant: "default",
  },
  argTypes: {
    variant: {
      control: "select",
      options: variants,
      description: "배지의 시각적 스타일 Variant를 지정합니다.",
    },
    tone: {
      control: "select",
      options: tones,
      description:
        "배지의 의미론적 Tone을 지정합니다. (variant가 없을 때 자동으로 대응하는 스타일이 지정됩니다)",
    },
  },
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

/**
 * 기본 Playground 스토리입니다. 컨트롤을 사용하여 직접 속성을 테스트할 수 있습니다.
 */
export const Playground: Story = {
  args: {
    children: "배지",
  },
}

/**
 * 지원하는 모든 Variant 예제입니다.
 */
export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="ghost">Ghost</Badge>
      <Badge variant="link">Link</Badge>
    </div>
  ),
}

/**
 * tone 속성으로 의미(tone)를 지정하는 예제입니다.
 */
export const Tones: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge tone="neutral">Neutral</Badge>
      <Badge tone="success">Success</Badge>
      <Badge tone="danger">Danger</Badge>
      <Badge tone="info">Info</Badge>
      <Badge tone="selected">Selected</Badge>
    </div>
  ),
}

/**
 * 아이콘과 함께 복합적으로 사용하는 예제입니다.
 */
export const WithIcon: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge variant="default">
        <Star data-icon="inline-start" />
        추천
      </Badge>
      <Badge tone="success">
        <CheckCircle data-icon="inline-start" />
        완료
      </Badge>
      <Badge tone="danger">
        <AlertCircle data-icon="inline-start" />
        에러 발생
      </Badge>
      <Badge tone="info">
        <Info data-icon="inline-start" />
        안내사항
      </Badge>
    </div>
  ),
}

/**
 * render prop을 사용하여 링크나 다른 태그로 커스텀 렌더링하는 예제입니다.
 * a 태그로 렌더링하면 호버 시 스타일 효과가 추가로 적용됩니다.
 */
export const AsLink: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge
        render={(props) => (
          <a
            {...props}
            href="https://example.test/design-system"
            target="_blank"
            rel="noreferrer"
          >
            디자인 시스템 문서
          </a>
        )}
        variant="default"
      />
      <Badge
        render={(props) => (
          <a
            {...props}
            href="https://example.test/changelog"
            target="_blank"
            rel="noreferrer"
          >
            변경 이력
          </a>
        )}
        variant="outline"
      />
      <Badge
        render={(props) => (
          <a {...props} href="#" onClick={(e) => e.preventDefault()}>
            더 알아보기
          </a>
        )}
        variant="link"
      />
    </div>
  ),
}
