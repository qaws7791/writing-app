"use client"

import * as React from "react"

import { useIsMobile } from "#ui/hooks/use-mobile"
import { cn } from "#ui/lib/utils"
import { LearnerShell } from "#ui/blocks/learner-shell"
import { Badge } from "#ui/components/primitives/badge"
import { Button } from "#ui/components/primitives/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "#ui/components/primitives/empty"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "#ui/components/primitives/sheet"

const DOMAINS = [
  "일상·실용문",
  "학업·논술문",
  "업무·비즈니스 문서",
  "창작·문학",
  "설득·의견문",
  "정보전달·설명문",
  "자기서사·기록",
  "관계·소통 문서",
  "공적·행정 문서",
  "디지털·뉴미디어",
] as const

type Difficulty = "입문" | "기본" | "심화"

type CatalogTask = {
  id: string
  domain: (typeof DOMAINS)[number]
  typeName: string
  title: string
  situation: string
  audience: string
  goalChars: number
  difficulty: Difficulty
  published: boolean
}

const TASKS: CatalogTask[] = [
  {
    id: "t-invite",
    domain: "일상·실용문",
    typeName: "초대장",
    title: "주말 소풍 초대 메시지",
    situation:
      "주말에 가까운 사람을 공원 소풍에 초대하는 짧은 메시지를 씁니다.",
    audience: "친구",
    goalChars: 120,
    difficulty: "입문",
    published: true,
  },
  {
    id: "t-review",
    domain: "일상·실용문",
    typeName: "후기",
    title: "동네 식당 후기",
    situation: "어제 간 식당을 다른 손님이 고를 수 있게 후기를 남깁니다.",
    audience: "처음 오는 손님",
    goalChars: 200,
    difficulty: "기본",
    published: true,
  },
  {
    id: "t-summary",
    domain: "학업·논술문",
    typeName: "요약문",
    title: "기사 한 편의 핵심 요약",
    situation: "제공된 기사의 주장과 근거만 남기고 짧게 정리합니다.",
    audience: "같은 수업 동료",
    goalChars: 250,
    difficulty: "기본",
    published: true,
  },
  {
    id: "t-email",
    domain: "업무·비즈니스 문서",
    typeName: "이메일",
    title: "회의 일정 변경 안내",
    situation: "내일 회의를 이틀 뒤로 미루는 이유를 정중하게 알립니다.",
    audience: "함께 일하는 팀",
    goalChars: 180,
    difficulty: "입문",
    published: true,
  },
  {
    id: "t-essay",
    domain: "창작·문학",
    typeName: "수필",
    title: "비 오는 출근길",
    situation: "오늘 아침의 한 장면을 짧은 수필로 옮깁니다.",
    audience: "글 읽는 낯선 사람",
    goalChars: 400,
    difficulty: "심화",
    published: true,
  },
  {
    id: "t-column",
    domain: "설득·의견문",
    typeName: "칼럼",
    title: "숙제 폐지 찬반 칼럼",
    situation: "숙제를 줄이자는 주장과 근거, 예상 반론을 한 칼럼으로 씁니다.",
    audience: "학교 신문 독자",
    goalChars: 500,
    difficulty: "심화",
    published: true,
  },
  {
    id: "t-explain",
    domain: "정보전달·설명문",
    typeName: "개념 설명",
    title: "캐시와 쿠키 차이 설명",
    situation:
      "기술 지식이 없는 동료에게 두 개념의 차이를 순서대로 설명합니다.",
    audience: "비개발 동료",
    goalChars: 300,
    difficulty: "기본",
    published: true,
  },
  {
    id: "t-intro",
    domain: "자기서사·기록",
    typeName: "자기소개서",
    title: "지원 동기 한 문단",
    situation: "지원하는 일과 내 경험을 한 문단에서 연결합니다.",
    audience: "채용 담당자",
    goalChars: 400,
    difficulty: "기본",
    published: true,
  },
  {
    id: "t-thanks",
    domain: "관계·소통 문서",
    typeName: "감사편지",
    title: "도움을 준 동료에게 감사",
    situation: "바쁜 일정 중에 일을 나눠 준 동료에게 짧게 감사를 전합니다.",
    audience: "동료",
    goalChars: 160,
    difficulty: "입문",
    published: true,
  },
  {
    id: "t-blog",
    domain: "디지털·뉴미디어",
    typeName: "블로그 포스트",
    title: "주말 산책 코스 소개",
    situation: "독자가 따라 걸을 수 있게 코스와 이유를 소개합니다.",
    audience: "블로그 독자",
    goalChars: 350,
    difficulty: "기본",
    published: true,
  },
]

/**
 * Learner writing catalog: domain chips, published type chips, task cards, and a preview overlay.
 */
export function WritingCatalog({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const published = TASKS.filter((task) => task.published)
  const [domain, setDomain] = React.useState<string | null>(null)
  const [typeName, setTypeName] = React.useState<string | null>(null)
  const [previewId, setPreviewId] = React.useState<string | null>(null)
  const isMobile = useIsMobile()

  const domainsWithTasks = DOMAINS.filter((item) =>
    published.some((task) => task.domain === item)
  )
  const visibleTasks = published.filter((task) => {
    if (domain && task.domain !== domain) return false
    if (typeName && task.typeName !== typeName) return false
    return true
  })
  const typeNames = domain
    ? [
        ...new Set(
          published
            .filter((task) => task.domain === domain)
            .map((task) => task.typeName)
        ),
      ]
    : []
  const preview = published.find((task) => task.id === previewId) ?? null

  return (
    <LearnerShell
      data-slot="writing-catalog"
      className={className}
      currentNav="write"
      {...props}
    >
      <main className="@container mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-5 py-10 sm:px-8 sm:py-12">
        <header className="flex max-w-xl flex-col gap-2">
          <h1 className="font-heading text-3xl font-semibold tracking-[-0.04em] text-balance sm:text-4xl sm:leading-[1.15]">
            과제
          </h1>
          <p className="text-sm leading-6 text-pretty text-muted-foreground">
            상황과 장르를 좁혀 쓸 과제를 고릅니다.
          </p>
        </header>

        <div className="flex flex-col gap-3">
          <div
            className="flex flex-wrap gap-2"
            role="toolbar"
            aria-label="도메인"
          >
            <FilterChip
              pressed={domain === null}
              onPressed={() => {
                setDomain(null)
                setTypeName(null)
              }}
            >
              전체
            </FilterChip>
            {domainsWithTasks.map((item) => (
              <FilterChip
                key={item}
                pressed={domain === item}
                onPressed={() => {
                  setDomain(item)
                  setTypeName(null)
                }}
              >
                {item}
              </FilterChip>
            ))}
          </div>
          {typeNames.length > 0 ? (
            <div
              className="flex flex-wrap gap-2"
              role="toolbar"
              aria-label="유형"
            >
              {typeNames.map((item) => (
                <FilterChip
                  key={item}
                  pressed={typeName === item}
                  onPressed={() =>
                    setTypeName((current) => (current === item ? null : item))
                  }
                >
                  {item}
                </FilterChip>
              ))}
            </div>
          ) : null}
        </div>

        {visibleTasks.length > 0 ? (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {visibleTasks.map((task) => (
              <li key={task.id}>
                <button
                  type="button"
                  className="flex h-full w-full flex-col gap-3 rounded-[1.75rem] border border-border/70 bg-card px-4 py-4 text-left shadow-2xs outline-none transition-colors hover:bg-accent/40 focus-visible:ring-3 focus-visible:ring-ring/40"
                  onClick={() => setPreviewId(task.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs text-muted-foreground">
                      {task.domain} · {task.typeName}
                    </p>
                    <Badge variant="outline">{task.difficulty}</Badge>
                  </div>
                  <h2 className="font-heading text-base font-semibold tracking-[-0.02em] text-balance">
                    {task.title}
                  </h2>
                  <p className="line-clamp-2 text-sm leading-6 text-pretty text-muted-foreground">
                    {task.situation}
                  </p>
                  <p className="text-xs tabular-nums text-muted-foreground">
                    목표 {task.goalChars.toLocaleString("ko-KR")}자 ·{" "}
                    {task.audience}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <Empty variant="frame">
            <EmptyHeader>
              <EmptyTitle>해당하는 과제가 없습니다</EmptyTitle>
              <EmptyDescription>
                다른 도메인이나 유형을 골라 보세요.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </main>

      <Sheet
        open={preview !== null}
        onOpenChange={(open) => {
          if (!open) setPreviewId(null)
        }}
      >
        <SheetContent
          className="max-h-[min(80dvh,100%)] overflow-hidden"
          side={isMobile ? "bottom" : "center"}
        >
          {preview ? (
            <>
              <SheetHeader className="border-b-0">
                <p className="text-xs text-muted-foreground">
                  {preview.domain} · {preview.typeName} · {preview.difficulty}
                </p>
                <SheetTitle>{preview.title}</SheetTitle>
                <SheetDescription>{preview.situation}</SheetDescription>
              </SheetHeader>
              <dl className="grid min-h-0 flex-1 grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 overflow-y-auto px-6 py-4 text-sm">
                <dt className="text-muted-foreground">독자</dt>
                <dd>{preview.audience}</dd>
                <dt className="text-muted-foreground">분량</dt>
                <dd className="tabular-nums">
                  목표 {preview.goalChars.toLocaleString("ko-KR")}자
                </dd>
                <dt className="text-muted-foreground">난이도</dt>
                <dd>{preview.difficulty}</dd>
              </dl>
              <SheetFooter className="border-t-0 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                <Button type="button" size="lg" className="w-full">
                  시작하기
                </Button>
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </LearnerShell>
  )
}

function FilterChip({
  pressed,
  onPressed,
  children,
}: {
  pressed: boolean
  onPressed: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
        pressed
          ? "border-foreground/15 bg-foreground text-background"
          : "border-border/80 bg-card text-muted-foreground hover:bg-accent/60 hover:text-foreground"
      )}
      onClick={onPressed}
    >
      {children}
    </button>
  )
}

export default WritingCatalog
