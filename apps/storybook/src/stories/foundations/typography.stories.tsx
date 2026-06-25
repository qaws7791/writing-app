import type { Meta, StoryObj } from "@storybook/react-vite"

const textTokens = [
  {
    className: "text-display-lg",
    sample: "글결 학습 경험",
    token: "text-display-lg",
    usage: "제품 첫 화면의 가장 큰 메시지",
  },
  {
    className: "text-heading-lg",
    sample: "오늘의 쓰기 루틴",
    token: "text-heading-lg",
    usage: "페이지 상단 제목",
  },
  {
    className: "text-heading-md",
    sample: "문장의 중심 찾기",
    token: "text-heading-md",
    usage: "섹션 제목",
  },
  {
    className: "text-title-lg",
    sample: "코스 진행률",
    token: "text-title-lg",
    usage: "카드 제목",
  },
  {
    className: "text-body-md",
    sample: "짧은 학습과 즉시 쓰기를 반복하며 글쓰기 감각을 쌓습니다.",
    token: "text-body-md",
    usage: "본문",
  },
  {
    className: "text-label-md",
    sample: "필드 라벨",
    token: "text-label-md",
    usage: "입력 라벨",
  },
  {
    className: "text-caption",
    sample: "최근 수정 2026.06.25",
    token: "text-caption",
    usage: "보조 메타데이터",
  },
] as const

const meta = {
  title: "Foundations/Typography",
  parameters: {
    layout: "padded",
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Scale: Story = {
  render: () => (
    <div className="grid max-w-5xl gap-4">
      {textTokens.map((item) => (
        <section
          className="grid gap-3 rounded-panel border border-border-subtle bg-bg-surface p-surface-padding-md md:grid-cols-[12rem_1fr]"
          key={item.token}
        >
          <div>
            <p className="text-label-sm font-black text-fg-default">
              {item.token}
            </p>
            <p className="text-caption font-medium text-fg-muted">
              {item.usage}
            </p>
          </div>
          <p className={`${item.className} font-bold`}>{item.sample}</p>
        </section>
      ))}
    </div>
  ),
}

export const LongContent: Story = {
  render: () => (
    <article className="grid max-w-3xl gap-5 rounded-panel border border-border-subtle bg-bg-surface p-surface-padding-lg">
      <h1 className="text-heading-lg font-black">
        길이가 긴 제목도 행간과 줄바꿈을 유지한다
      </h1>
      <p className="text-body-md font-medium text-fg-muted">
        디자인 시스템의 타이포그래피 토큰은 화면 크기에 따라 임의로 확대하지
        않고, 정해진 역할과 밀도 안에서 읽기 흐름을 유지한다.
      </p>
      <p className="text-body-md font-medium">
        문서형 화면, 학습 진행 화면, 어드민 도구에서 같은 계층을 반복해 사용해도
        텍스트가 컨테이너를 밀어내지 않는지 확인한다.
      </p>
    </article>
  ),
}
