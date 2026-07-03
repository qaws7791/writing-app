import type { Meta, StoryObj } from "@storybook/react-vite"

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
        <p className="mt-2 text-body-md font-medium text-muted-foreground">
          fill과 foreground를 분리한 semantic token이다.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {colorTokens.map((color) => (
          <div
            className="grid min-h-36 content-between rounded-card border border-border/50 p-5"
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
        <div className="grid gap-2 border-b border-border/50 pb-4" key={token}>
          <span className="text-caption font-bold text-muted-foreground/70">
            {token}
          </span>
          <p className={`${className} font-bold`}>{text}</p>
        </div>
      ))}
    </div>
  ),
}
