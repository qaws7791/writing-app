import type { Meta, StoryObj } from "@storybook/react-vite"

import { Button, Input, Progress, ProgressValue } from "@workspace/ui"

type ColorToken = {
  readonly background: string
  readonly foreground?: string
  readonly label: string
  readonly token: string
}

const colorTokens: ColorToken[] = [
  {
    background: "var(--semantic-color-bg-canvas)",
    foreground: "var(--semantic-color-fg-default)",
    label: "Canvas",
    token: "bg-canvas",
  },
  {
    background: "var(--semantic-color-bg-surface)",
    foreground: "var(--semantic-color-fg-default)",
    label: "Surface",
    token: "bg-surface",
  },
  {
    background: "var(--semantic-color-action-primary-bg)",
    foreground: "var(--semantic-color-action-primary-fg)",
    label: "Primary Action",
    token: "action-primary",
  },
  {
    background: "var(--semantic-color-action-selected-bg)",
    foreground: "var(--semantic-color-action-selected-fg)",
    label: "Selected",
    token: "action-selected",
  },
  {
    background: "var(--semantic-color-success-bg)",
    foreground: "var(--semantic-color-success-fg)",
    label: "Success",
    token: "success",
  },
  {
    background: "var(--semantic-color-danger-bg)",
    foreground: "var(--semantic-color-danger-fg)",
    label: "Danger",
    token: "danger",
  },
  {
    background: "var(--semantic-color-info-bg)",
    foreground: "var(--semantic-color-info-fg)",
    label: "Info",
    token: "info",
  },
]

const typeTokens = [
  {
    className: "text-display-lg",
    text: "글결로 글쓰기 루틴 만들기",
    token: "display-lg",
  },
  {
    className: "text-heading-lg",
    text: "오늘의 학습",
    token: "heading-lg",
  },
  {
    className: "text-heading-md",
    text: "문장을 더 선명하게 고쳐 보세요",
    token: "heading-md",
  },
  {
    className: "text-title-lg",
    text: "코스 진행률",
    token: "title-lg",
  },
  {
    className: "text-body-md",
    text: "짧은 학습과 즉시 쓰기를 반복하며 글쓰기 감각을 쌓습니다.",
    token: "body-md",
  },
  {
    className: "text-label-md",
    text: "필드 라벨",
    token: "label-md",
  },
  {
    className: "text-caption",
    text: "2026.06.25",
    token: "caption",
  },
] as const

const meta = {
  title: "Foundations/Tokens",
  parameters: {
    layout: "padded",
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Colors: Story = {
  render: () => (
    <div className="grid gap-5">
      <div>
        <h2 className="text-heading-lg font-black">색상 토큰</h2>
        <p className="mt-2 text-body-md font-medium text-fg-muted">
          fill과 foreground를 분리한 semantic token이다.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {colorTokens.map((color) => (
          <div
            className="grid min-h-36 content-between rounded-card border border-border-subtle p-5"
            key={color.token}
            style={{
              background: color.background,
              color: color.foreground ?? "var(--semantic-color-fg-default)",
            }}
          >
            <span className="text-label-sm font-bold">{color.token}</span>
            <strong className="text-title-lg">{color.label}</strong>
          </div>
        ))}
      </div>
    </div>
  ),
}

export const Typography: Story = {
  render: () => (
    <div className="grid max-w-4xl gap-6">
      {typeTokens.map(({ className, text, token }) => (
        <div
          className="grid gap-2 border-b border-border-subtle pb-4"
          key={token}
        >
          <span className="text-caption font-bold text-fg-subtle">{token}</span>
          <p className={`${className} font-bold`}>{text}</p>
        </div>
      ))}
    </div>
  ),
}

export const Density: Story = {
  render: () => (
    <div className="grid gap-6 lg:grid-cols-2">
      {(["comfortable", "compact"] as const).map((density) => (
        <section
          className="grid gap-4 rounded-panel border border-border-subtle bg-bg-surface p-surface-padding-md"
          data-density={density}
          key={density}
        >
          <div>
            <h2 className="text-title-lg font-black">{density}</h2>
            <p className="text-body-sm font-medium text-fg-muted">
              root density가 control, surface, radius token을 바꾼다.
            </p>
          </div>
          <Input aria-label={`${density} 검색`} placeholder="검색어" />
          <Progress value={64} aria-label={`${density} 진행률`}>
            <ProgressValue />
          </Progress>
          <div className="flex flex-wrap gap-2">
            <Button>저장</Button>
            <Button variant="outline">취소</Button>
          </div>
        </section>
      ))}
    </div>
  ),
}
