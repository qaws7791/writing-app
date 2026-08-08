"use client"

import * as React from "react"

import { LearnerShell } from "#ui/blocks/learner-shell"

type CatalogCourse = {
  id: string
  title: string
  description: string
  lessonCount: number
}

type CatalogTopic = {
  id: string
  title: string
  lead?: string
  pattern: "dots" | "lines" | "grid" | "rings"
  courses: CatalogCourse[]
}

const TOPICS: CatalogTopic[] = [
  {
    id: "reading",
    title: "읽기",
    lead: "문장과 단락에서 의미를 정확히 짚는 코스",
    pattern: "dots",
    courses: [
      {
        id: "vocab-meaning",
        title: "어휘와 문장의 의미 정확히 읽기",
        description:
          "문맥 단서로 낯선 어휘의 뜻을 추론하고, 문장 단위로 의미를 정리합니다.",
        lessonCount: 20,
      },
      {
        id: "paragraph-main",
        title: "단락의 중심 생각 찾기",
        description:
          "핵심 문장과 보조 정보를 구분해 단락이 말하는 바를 요약합니다.",
        lessonCount: 14,
      },
      {
        id: "inference-short",
        title: "짧은 글에서 추론하기",
        description:
          "명시되지 않은 관계를 글로 주어진 단서만으로 조심스럽게 읽습니다.",
        lessonCount: 12,
      },
    ],
  },
  {
    id: "speaking",
    title: "회화",
    lead: "일상 장면을 자연스럽게 말하는 코스",
    pattern: "lines",
    courses: [
      {
        id: "greetings",
        title: "인사와 자기소개",
        description:
          "처음 만나는 사람에게 인사하고 나를 짧게 소개하는 표현을 익힙니다.",
        lessonCount: 8,
      },
      {
        id: "daily-request",
        title: "부탁과 거절하기",
        description:
          "부탁·수락·거절의 톤을 상황에 맞게 고르고 이어 말하는 연습을 합니다.",
        lessonCount: 10,
      },
      {
        id: "ordering",
        title: "가게에서 주문하기",
        description:
          "메뉴 확인, 주문, 변경 요청처럼 짧은 대화를 순서대로 구성합니다.",
        lessonCount: 9,
      },
    ],
  },
  {
    id: "listening",
    title: "듣기",
    lead: "말의 흐름과 핵심을 잡는 코스",
    pattern: "grid",
    courses: [
      {
        id: "listen-gist",
        title: "대화의 요지 듣기",
        description: "세부보다 먼저 화자와 목적, 결론을 듣고 정리합니다.",
        lessonCount: 11,
      },
      {
        id: "listen-detail",
        title: "숫자와 시간 정보 듣기",
        description:
          "일정·가격·장소처럼 놓치기 쉬운 정보를 정확히 받아 적습니다.",
        lessonCount: 10,
      },
    ],
  },
  {
    id: "writing",
    title: "쓰기",
    lead: "짧은 문장을 또렷하게 쓰는 코스",
    pattern: "rings",
    courses: [
      {
        id: "sentence-build",
        title: "문장 뼈대 만들기",
        description:
          "주어·서술어·수식 관계를 정리해 짧고 분명한 문장을 씁니다.",
        lessonCount: 16,
      },
      {
        id: "message-reply",
        title: "메시지에 답장하기",
        description:
          "받은 메시지의 목적을 읽고, 예의와 정보가 맞는 답장을 작성합니다.",
        lessonCount: 12,
      },
      {
        id: "opinion-short",
        title: "짧은 의견 쓰기",
        description:
          "주장 한 문장과 근거 한 문장으로 의견을 또렷하게 남깁니다.",
        lessonCount: 13,
      },
    ],
  },
]

function CoursePattern({ pattern }: { pattern: CatalogTopic["pattern"] }) {
  return (
    <div
      data-slot="learn-catalog-pattern"
      className="relative aspect-[4/3] overflow-hidden rounded-[1.25rem] bg-muted"
      aria-hidden="true"
    >
      {pattern === "dots" ? (
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(circle, color-mix(in oklch, var(--foreground) 28%, transparent) 1.1px, transparent 1.2px)",
            backgroundSize: "12px 12px",
          }}
        />
      ) : null}
      {pattern === "lines" ? (
        <div
          className="absolute inset-0 opacity-[0.28]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(-18deg, color-mix(in oklch, var(--foreground) 22%, transparent) 0 1px, transparent 1px 10px)",
          }}
        />
      ) : null}
      {pattern === "grid" ? (
        <div
          className="absolute inset-0 opacity-[0.3]"
          style={{
            backgroundImage:
              "linear-gradient(color-mix(in oklch, var(--foreground) 18%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklch, var(--foreground) 18%, transparent) 1px, transparent 1px)",
            backgroundSize: "16px 16px",
          }}
        />
      ) : null}
      {pattern === "rings" ? (
        <>
          <span className="absolute top-1/2 left-1/2 size-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-foreground/15" />
          <span className="absolute top-1/2 left-1/2 size-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-foreground/20" />
          <span className="absolute top-[28%] left-[22%] size-3 rounded-full bg-foreground/12" />
        </>
      ) : null}
      <span className="absolute inset-3 rounded-[0.9rem] border border-border/50" />
    </div>
  )
}

function CourseCard({
  course,
  pattern,
}: {
  course: CatalogCourse
  pattern: CatalogTopic["pattern"]
}) {
  return (
    <article
      data-slot="learn-catalog-course"
      className="flex flex-col gap-4 rounded-[1.75rem] bg-muted/55 p-4 sm:p-5"
    >
      <CoursePattern pattern={pattern} />
      <div className="flex min-w-0 flex-1 flex-col gap-2 px-0.5 pb-0.5">
        <h3 className="font-heading text-base font-semibold tracking-[-0.02em] text-balance">
          {course.title}
        </h3>
        <p className="line-clamp-2 text-sm leading-6 text-pretty text-muted-foreground">
          {course.description}
        </p>
        <p className="mt-auto pt-1 text-xs tabular-nums text-muted-foreground">
          {course.lessonCount}레슨
        </p>
      </div>
    </article>
  )
}

/**
 * Logged-in learner course catalog: topic sections with quiet pattern thumbnails.
 * Static list only — no search, filters, or course actions.
 */
export function LearnCatalog({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <LearnerShell
      data-slot="learn-catalog"
      className={className}
      currentNav="learn"
      {...props}
    >
      <main className="@container mx-auto flex w-full max-w-5xl flex-1 flex-col gap-12 px-5 py-10 sm:px-8 sm:py-12">
        <header
          data-slot="learn-catalog-intro"
          className="flex max-w-xl flex-col gap-2"
          aria-labelledby="learn-catalog-title"
        >
          <h1
            id="learn-catalog-title"
            className="font-heading text-3xl font-semibold tracking-[-0.04em] text-balance sm:text-4xl sm:leading-[1.15]"
          >
            코스
          </h1>
          <p className="text-sm leading-6 text-pretty text-muted-foreground sm:text-[0.9375rem]">
            주제별로 코스를 살펴보세요
          </p>
        </header>

        <div className="flex flex-col gap-14">
          {TOPICS.map((topic) => (
            <section
              key={topic.id}
              data-slot="learn-catalog-topic"
              aria-labelledby={`learn-catalog-topic-${topic.id}`}
              className="flex flex-col gap-5"
            >
              <header className="flex flex-col gap-1.5">
                <h2
                  id={`learn-catalog-topic-${topic.id}`}
                  className="font-heading text-xl font-semibold tracking-[-0.03em] sm:text-2xl"
                >
                  {topic.title}
                </h2>
                {topic.lead ? (
                  <p className="text-sm text-muted-foreground">{topic.lead}</p>
                ) : null}
              </header>

              <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,15rem),1fr))] gap-3 @[40rem]:gap-4">
                {topic.courses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    pattern={topic.pattern}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </LearnerShell>
  )
}

export default LearnCatalog
