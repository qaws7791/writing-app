import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  Bookmark01Icon,
  BookmarkCheckIcon,
  Share01Icon,
  MoreHorizontalIcon,
  ArrowRight01Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons"
import { Badge } from "@workspace/ui/components/badge"

// ─── 시리즈 상세 데이터 타입 ─────────────────────────────────

interface SeriesPrompt {
  id: number
  title: string
  /** 해당 글감의 완료 여부 */
  completed: boolean
}

interface SeriesDetail {
  id: string
  title: string
  description: string
  topic: string
  promptCount: number
  completedCount: number
  bookmarked: boolean
  /** 시리즈 소개글 */
  intro: string
  /** 시리즈에 속한 글감 목록 */
  prompts: SeriesPrompt[]
  /** 글쓰기 팁 */
  tips: string[]
}

// ─── 목 데이터 ──────────────────────────────────────────────

const allSeries: Record<string, SeriesDetail> = {
  "series-1": {
    id: "series-1",
    title: "나를 돌아보는 7일",
    description: "일주일 동안 매일 하나씩, 나에 대해 깊이 써보는 시리즈",
    topic: "자기이해",
    promptCount: 7,
    completedCount: 2,
    bookmarked: true,
    intro:
      "일주일 동안 매일 하나의 질문에 답하며 나를 깊이 들여다보는 시리즈입니다. 거창한 이야기가 아니어도 괜찮아요. 오늘의 나를 솔직하게 적어보세요. 7일이 지나면 자신에 대해 조금 더 알게 될 거예요.",
    prompts: [
      { id: 101, title: "나는 누구인가?", completed: true },
      { id: 102, title: "내가 가장 두려워하는 것은?", completed: true },
      { id: 103, title: "나를 가장 행복하게 만드는 것은?", completed: false },
      { id: 104, title: "지금의 나를 만든 결정적 순간", completed: false },
      { id: 105, title: "내가 가장 자주 하는 거짓말", completed: false },
      { id: 106, title: "10년 전의 나에게 해주고 싶은 말", completed: false },
      { id: 107, title: "지금 이 순간, 나는 어떤 사람인가?", completed: false },
    ],
    tips: [
      "하루에 하나씩, 순서대로 쓰는 것을 추천해요",
      "이전 글을 다 쓰지 않아도 다음으로 넘어갈 수 있어요",
      "완성된 글은 나중에 모아서 읽으면 더 의미 있어요",
      "부담 없이 짧게 써도 괜찮아요",
    ],
  },
  "series-2": {
    id: "series-2",
    title: "관계의 온도",
    description: "소중한 사람들과의 관계를 글로 정리해보세요",
    topic: "관계",
    promptCount: 5,
    completedCount: 0,
    bookmarked: false,
    intro:
      "우리는 수많은 관계 속에서 살아갑니다. 가까운 사람, 멀어진 사람, 스쳐 지나간 사람까지. 이 시리즈에서는 다양한 관계를 돌아보며, 그 사이의 온도를 글로 기록해봅니다.",
    prompts: [
      { id: 201, title: "가장 오래된 친구에게", completed: false },
      { id: 202, title: "가족에게 하지 못한 말", completed: false },
      { id: 203, title: "스쳐 지나간 인연에게", completed: false },
      { id: 204, title: "나에게 가장 큰 영향을 준 사람", completed: false },
      { id: 205, title: "앞으로 만들고 싶은 관계", completed: false },
    ],
    tips: [
      "특정 사람을 떠올리며 쓰면 더 진솔한 글이 돼요",
      "감정을 있는 그대로 적어보세요",
      "편지 형식으로 써봐도 좋아요",
    ],
  },
  "series-3": {
    id: "series-3",
    title: "사회를 읽는 눈",
    description: "우리 사회의 다양한 이슈에 대해 자신의 관점을 정리해보세요",
    topic: "사회",
    promptCount: 6,
    completedCount: 0,
    bookmarked: false,
    intro:
      "매일 스치는 뉴스, 대화 속 의견들. 그 안에서 나는 어떤 생각을 하고 있을까요? 이 시리즈에서는 사회의 다양한 이슈에 대해 자신만의 관점을 글로 정리해봅니다. 옳고 그름보다 '나는 이렇게 생각한다'는 것이 중요합니다.",
    prompts: [
      { id: 301, title: "공정이란 무엇인가", completed: false },
      { id: 302, title: "세대 갈등의 본질", completed: false },
      { id: 303, title: "디지털 시대의 고독", completed: false },
      { id: 304, title: "일과 삶의 경계가 사라진다면", completed: false },
      {
        id: 305,
        title: "말의 무게 — SNS 시대의 표현의 자유",
        completed: false,
      },
      { id: 306, title: "내가 원하는 사회의 모습", completed: false },
    ],
    tips: [
      "자신의 경험과 연결지어 쓰면 설득력이 높아져요",
      "반대 의견도 함께 다뤄보면 깊이가 생겨요",
      "결론을 내릴 필요 없이 생각을 펼쳐놓는 것도 좋아요",
    ],
  },
}

// ─── 도우미 컴포넌트 ────────────────────────────────────────

/** 진행률 바 */
function ProgressBar({
  completed,
  total,
}: {
  completed: number
  total: number
}) {
  const percentage = total > 0 ? (completed / total) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      <div className="h-1.5 flex-1 rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-foreground transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
        {completed}/{total}
      </span>
    </div>
  )
}

// ─── 페이지 ─────────────────────────────────────────────────

export default async function PromptSeriesDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // 목 데이터에서 찾기 (없으면 기본 데이터 사용)
  const series: SeriesDetail = allSeries[id] ?? allSeries["series-1"]!

  return (
    <div className="min-h-svh flex-1 bg-background px-6 py-12 lg:px-16">
      <div className="mx-auto max-w-3xl">
        {/* ── 상단 네비게이션 ── */}
        <nav className="mb-10 flex items-center justify-between">
          <Link
            href="/prompts"
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
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
            {/* 북마크 */}
            <button
              type="button"
              className={`flex size-9 items-center justify-center rounded-lg transition-colors hover:bg-muted hover:text-foreground ${
                series.bookmarked ? "text-foreground" : "text-muted-foreground"
              }`}
              aria-label="북마크"
            >
              <HugeiconsIcon
                icon={series.bookmarked ? BookmarkCheckIcon : Bookmark01Icon}
                size={18}
                strokeWidth={1.5}
              />
            </button>
            {/* 공유 */}
            <button
              type="button"
              className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="공유"
            >
              <HugeiconsIcon
                icon={Share01Icon}
                size={18}
                color="currentColor"
                strokeWidth={1.5}
              />
            </button>
            {/* 더보기 */}
            <button
              type="button"
              className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="더 보기"
            >
              <HugeiconsIcon
                icon={MoreHorizontalIcon}
                size={18}
                color="currentColor"
                strokeWidth={1.5}
              />
            </button>
          </div>
        </nav>

        {/* ── 메인 헤더 ── */}
        <header className="mb-10">
          {/* 메타 정보 */}
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-xs font-medium">
              {series.topic}
            </Badge>
            <Badge variant="outline" className="text-xs font-normal">
              시리즈
            </Badge>
            <span className="text-xs text-muted-foreground">
              {series.promptCount}편
            </span>
          </div>

          {/* 시리즈 제목 */}
          <h1 className="text-2xl leading-snug font-semibold tracking-tight text-foreground md:text-3xl">
            {series.title}
          </h1>

          {/* 짧은 설명 */}
          <p className="mt-2 text-sm text-muted-foreground md:text-base">
            {series.description}
          </p>

          {/* 진행률 */}
          <div className="mt-6">
            <ProgressBar
              completed={series.completedCount}
              total={series.promptCount}
            />
          </div>
        </header>

        {/* ── 소개글 ── */}
        <section className="mb-10">
          <p className="text-sm leading-8 text-muted-foreground md:text-base">
            {series.intro}
          </p>
        </section>

        {/* ── 글감 목록 ── */}
        <section className="mb-10 rounded-2xl border border-border bg-card">
          <h2 className="p-6 pb-2 text-sm font-semibold text-foreground md:text-base">
            글감 목록
          </h2>
          <ol className="flex flex-col">
            {series.prompts.map((prompt, i) => (
              <li
                key={prompt.id}
                className={
                  i < series.prompts.length - 1
                    ? "border-b border-border/70"
                    : ""
                }
              >
                <Link
                  href={`/prompts/${prompt.id}`}
                  className="group flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/40"
                >
                  {/* 번호 */}
                  <span
                    className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      prompt.completed
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {i + 1}
                  </span>

                  {/* 글감 제목 + 상태 */}
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span
                      className={`text-sm leading-relaxed ${
                        prompt.completed
                          ? "text-muted-foreground"
                          : "text-foreground/80 group-hover:text-foreground"
                      }`}
                    >
                      {prompt.title}
                    </span>
                    {prompt.completed && (
                      <span className="text-xs text-muted-foreground">
                        작성 완료
                      </span>
                    )}
                  </div>

                  {/* 화살표 */}
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    size={16}
                    strokeWidth={1.5}
                    className={`shrink-0 transition-colors group-hover:text-foreground ${
                      prompt.completed
                        ? "text-muted-foreground/60"
                        : "text-muted-foreground"
                    }`}
                  />
                </Link>
              </li>
            ))}
          </ol>
        </section>

        {/* ── 글쓰기 팁 ── */}
        {series.tips.length > 0 && (
          <section className="mb-10 rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <HugeiconsIcon
                icon={SparklesIcon}
                size={16}
                strokeWidth={1.5}
                className="text-foreground"
              />
              <h2 className="text-sm font-semibold text-foreground md:text-base">
                시리즈 진행 팁
              </h2>
            </div>
            <ul className="flex flex-col gap-3">
              {series.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="mt-1.5 block size-1.25 shrink-0 rounded-full bg-border" />
                  <span className="text-sm leading-relaxed text-muted-foreground">
                    {tip}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}
