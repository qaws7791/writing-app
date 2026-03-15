import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  Bookmark01Icon,
  BookmarkCheckIcon,
  PencilEdit02Icon,
  Share01Icon,
  SparklesIcon,
  MoreHorizontalIcon,
} from "@hugeicons/core-free-icons"
import { Badge } from "@workspace/ui/components/badge"
import { LevelDots } from "@/components/level-dots"

// ─── 상세 데이터용 확장 타입 ───────────────────────────────

interface PromptDetail {
  id: number
  text: string
  description: string
  topic: string
  level: 1 | 2 | 3
  bookmarked: boolean
  /** 구조형일 때만 존재하는 추천 아웃라인 */
  outline?: string[]
  /** 글쓰기 팁 */
  tips: string[]
}

// ─── 목 데이터 ─────────────────────────────────────────────

/** 모든 글감 (ID로 찾기 용도) */
const allPrompts: Record<number, PromptDetail> = {
  1: {
    id: 1,
    text: "최근에 내 생각이 바뀐 순간은?",
    description:
      "우리는 매일 작은 변화를 겪습니다. 어떤 사건, 대화, 혹은 책 한 줄이 기존의 믿음을 흔들기도 하죠. 가장 최근에 생각이 바뀌었던 순간을 떠올려보세요. 무엇이 변했고, 왜 변했는지 솔직하게 써보세요.",
    topic: "자기이해",
    level: 1,
    bookmarked: true,
    tips: [
      "구체적인 장면이나 순간부터 시작해보세요",
      "변화 전과 후의 생각을 비교해서 써보세요",
      "왜 그 순간이 특별했는지 감정을 함께 적어보세요",
      "너무 거창한 변화가 아니어도 괜찮아요",
    ],
  },
  2: {
    id: 2,
    text: "사람들은 왜 익숙한 것을 떠나기 어려울까?",
    description:
      "변화를 원하면서도 현재에 머무르는 이유는 무엇일까요? 심리적 관성, 두려움, 혹은 안전감에 대해 생각해보세요. 나 자신의 경험이나, 주변 사람들의 모습을 관찰한 것을 바탕으로 써보세요.",
    topic: "사회",
    level: 2,
    bookmarked: false,
    tips: [
      "일반론보다 구체적인 사례로 시작해보세요",
      "자신의 경험과 연결지어 설득력을 높여보세요",
      "반대 의견도 함께 다뤄보면 깊이가 생겨요",
    ],
  },
  4: {
    id: 4,
    text: "10년 후의 나에게 편지를 써보세요",
    description:
      "미래의 나는 어떤 모습일까요? 지금의 고민, 바람, 다짐을 10년 후의 나에게 전해보세요. 편지 형식으로 자유롭게 쓰되, 현재의 감정을 솔직하게 담아보세요.",
    topic: "자기이해",
    level: 2,
    bookmarked: false,
    outline: [
      "인사 — 지금의 나를 소개하기",
      "현재 — 요즘 가장 많이 하는 생각",
      "고민 — 지금 풀리지 않는 것들",
      "바람 — 10년 뒤에 이루었으면 하는 것",
      "다짐 — 미래의 나에게 당부하고 싶은 것",
    ],
    tips: [
      "편지 형식이니 편하게 말하듯 써보세요",
      "추천 아웃라인을 참고하되, 자유롭게 변형해도 좋아요",
      "구체적인 숫자나 날짜를 넣으면 나중에 더 의미 있어요",
    ],
  },
  6: {
    id: 6,
    text: "AI가 일상에 들어오면서 잃어가는 것은?",
    description:
      "AI가 우리 삶 깊숙이 들어오고 있습니다. 편리함을 얻는 동시에 잃어가는 것은 무엇일까요? 인간 고유의 능력, 관계, 감정 등 다양한 관점에서 비판적으로 생각해보세요.",
    topic: "기술",
    level: 3,
    bookmarked: false,
    outline: [
      "도입 — AI가 일상에 들어온 장면 묘사",
      "편리함 — AI가 가져온 긍정적 변화",
      "상실 — AI로 인해 잃어가는 것들",
      "비판 — 이 변화를 어떻게 바라볼 것인가",
      "결론 — 기술과 인간의 바람직한 관계",
    ],
    tips: [
      "구체적인 AI 서비스 사례를 들어 시작해보세요",
      "단순한 비판보다 양면을 균형 있게 다뤄보세요",
      "자신의 일상 경험을 근거로 활용해보세요",
      "결론에서는 개인적인 입장을 분명히 해보세요",
    ],
  },
}

// ─── 페이지 ────────────────────────────────────────────────

export default async function PromptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const promptId = parseInt(id, 10)

  // 목 데이터에서 찾기 (없으면 기본 데이터 사용)
  const prompt: PromptDetail = allPrompts[promptId] ?? {
    id: promptId,
    text: "최근에 내 생각이 바뀐 순간은?",
    description:
      "우리는 매일 작은 변화를 겪습니다. 어떤 사건, 대화, 혹은 책 한 줄이 기존의 믿음을 흔들기도 하죠. 가장 최근에 생각이 바뀌었던 순간을 떠올려보세요.",
    topic: "자기이해",
    level: 1,
    bookmarked: false,
    tips: ["구체적인 장면부터 시작해보세요"],
  }

  return (
    <div className="min-h-svh flex-1 bg-[#FAFAFA] px-4 pb-32 lg:px-16">
      <div className="mx-auto max-w-[760px]">
        <div className="border-b border-[#EAEAEA]/80 bg-[#FAFAFA]/92 pb-6 backdrop-blur-xl lg:-mx-16 lg:px-16">
          <div className="mx-auto max-w-[760px]">
            {/* ── 상단 네비게이션 ── */}
            <nav className="sticky top-0 z-40 flex items-center justify-between bg-[#FAFAFA] py-2">
              <Link
                href="/prompts"
                className="flex items-center gap-1.5 text-[14px] font-medium text-[#888888] transition-colors hover:text-[#111111]"
              >
                <HugeiconsIcon
                  icon={ArrowLeft01Icon}
                  size={18}
                  color="currentColor"
                  strokeWidth={1.5}
                />
                글감 찾기
              </Link>

              <div className="flex items-center gap-1">
                {/* 공유 */}
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-[#888888] transition-colors hover:bg-[#F0F0F0] hover:text-[#111111]"
                  aria-label="공유"
                >
                  <HugeiconsIcon
                    icon={Share01Icon}
                    size={18}
                    color="currentColor"
                    strokeWidth={1.5}
                  />
                </button>
              </div>
            </nav>

            {/* ── 메인 헤더 ── */}
            <header className="mt-4">
              {/* 메타 정보 */}
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="text-[12px] font-medium">
                  {prompt.topic}
                </Badge>
                <LevelDots level={prompt.level} showLabel />
              </div>

              {/* 글감 제목 */}
              <h1 className="text-[26px] leading-snug font-semibold tracking-tight text-[#111111] md:text-[30px]">
                {prompt.text}
              </h1>

              {/* 설명 */}
              <p className="mt-4 text-[15px] leading-[1.8] text-[#666666]">
                {prompt.description}
              </p>
            </header>
          </div>
        </div>

        {/* ── 구조형 아웃라인 (있을 경우) ── */}
        {prompt.outline && prompt.outline.length > 0 && (
          <section className="mb-10 rounded-2xl border border-[#EAEAEA] bg-white p-6">
            <h2 className="mb-4 text-[15px] font-semibold text-[#111111]">
              추천 아웃라인
            </h2>
            <p className="mb-5 text-[13px] text-[#999999]">
              이 구조를 참고해서 써보세요. 꼭 따르지 않아도 괜찮아요.
            </p>
            <ol className="flex flex-col gap-0">
              {prompt.outline.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  {/* 타임라인 스타일 */}
                  <div className="flex flex-col items-center">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F5F5] text-[12px] font-semibold text-[#555555]">
                      {i + 1}
                    </span>
                    {i < prompt.outline!.length - 1 && (
                      <span className="mt-1 h-6 w-px bg-[#E5E5E5]" />
                    )}
                  </div>
                  <div className="pt-1 pb-4">
                    <span className="text-[14px] leading-relaxed text-[#333333]">
                      {item}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* ── 글쓰기 팁 ── */}
        {prompt.tips.length > 0 && (
          <section className="mb-10 rounded-2xl border border-[#EAEAEA] bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <HugeiconsIcon
                icon={SparklesIcon}
                size={16}
                color="#111111"
                strokeWidth={1.5}
              />
              <h2 className="text-[15px] font-semibold text-[#111111]">
                글쓰기 팁
              </h2>
            </div>
            <ul className="flex flex-col gap-3">
              {prompt.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="mt-1.5 block h-[5px] w-[5px] shrink-0 rounded-full bg-[#CCCCCC]" />
                  <span className="text-[14px] leading-relaxed text-[#555555]">
                    {tip}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* ── 하단 고정 CTA ── */}
      <div className="fixed inset-x-0 bottom-0 z-50 px-6 py-4 lg:px-16">
        <div className="mx-auto flex max-w-[760px] items-center gap-2">
          <Link
            href={`/write?prompt=${prompt.id}`}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#111111] px-6 py-3 text-[16px] font-semibold text-white transition-transform hover:bg-[#222222] active:scale-[0.98]"
          >
            <HugeiconsIcon
              icon={PencilEdit02Icon}
              size={18}
              color="currentColor"
              strokeWidth={1.5}
            />
            이 글감으로 글 쓰기
          </Link>
          {/* 북마크 */}
          <button
            type="button"
            className="flex size-12 shrink-0 items-center justify-center rounded-full text-[#888888] transition-colors hover:bg-[#F0F0F0] hover:text-[#111111]"
            aria-label="북마크"
          >
            <HugeiconsIcon
              icon={prompt.bookmarked ? BookmarkCheckIcon : Bookmark01Icon}
              size={18}
              color={prompt.bookmarked ? "#111111" : "currentColor"}
              strokeWidth={1.5}
            />
          </button>
        </div>
      </div>
    </div>
  )
}
