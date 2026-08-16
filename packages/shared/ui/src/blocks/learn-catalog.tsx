"use client"

import * as React from "react"

import { LearnerShell } from "#ui/blocks/learner-shell"
import {
  Carousel,
  CarouselContent,
  CarouselControls,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselProgress,
} from "#ui/components/primitives/carousel"

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
      {
        id: "tone-of-passage",
        title: "글의 어조와 태도 읽기",
        description: "선택 어휘와 문장 길이에서 필자의 태도를 구분해 읽습니다.",
        lessonCount: 9,
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
      {
        id: "ask-directions",
        title: "길 묻고 안내하기",
        description:
          "위치와 순서를 분명하게 묻고, 상대가 따라올 수 있게 안내합니다.",
        lessonCount: 8,
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
      {
        id: "listen-intent",
        title: "화자의 의도 듣기",
        description:
          "직접 말하지 않은 부탁과 거절을 말투와 맥락으로 가려 듣습니다.",
        lessonCount: 8,
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
      {
        id: "summary-short",
        title: "한 단락 요약하기",
        description: "핵심만 남기고 부연을 덜어 짧은 요약 문단을 만듭니다.",
        lessonCount: 11,
      },
    ],
  },
]

const catalogColumnClassName = "mx-auto w-full max-w-5xl px-5 sm:px-8"
const catalogCarouselPadClassName =
  "pl-[max(1.25rem,calc((100%-64rem)/2+1.25rem))] pr-5 sm:pl-[max(2rem,calc((100%-64rem)/2+2rem))] sm:pr-8"
const catalogCourseSlideClassName = "basis-[min(21.25rem,calc(100%-1.5rem))]"

function CoursePattern({ pattern }: { pattern: CatalogTopic["pattern"] }) {
  return (
    <div
      data-slot="learn-catalog-pattern"
      className="relative aspect-square overflow-hidden rounded-2xl bg-background"
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
  category,
  course,
  pattern,
}: {
  category: string
  course: CatalogCourse
  pattern: CatalogTopic["pattern"]
}) {
  return (
    <article
      data-slot="learn-catalog-course"
      className="flex aspect-[340/520] h-full w-full flex-col overflow-hidden rounded-5xl bg-muted shadow-xs"
    >
      <div className="shrink-0 p-7">
        <CoursePattern pattern={pattern} />
      </div>
      <div className="flex min-h-0 flex-1 flex-col px-6 pb-6">
        <p className="text-sm font-medium leading-5 text-muted-foreground">
          {category}
        </p>
        <h3 className="mt-2.5 line-clamp-3 font-heading text-xl font-normal leading-7 text-balance">
          {course.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm font-normal leading-5 text-pretty text-muted-foreground">
          {course.description}
        </p>
        <p className="mt-auto text-sm font-medium leading-5 tabular-nums text-muted-foreground">
          {course.lessonCount}개 레슨
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
      <main className="@container flex w-full flex-1 flex-col gap-12 overflow-x-clip py-10 sm:py-12">
        <header
          data-slot="learn-catalog-intro"
          className={catalogColumnClassName}
          aria-labelledby="learn-catalog-title"
        >
          <div className="flex max-w-xl flex-col gap-2">
            <h1
              id="learn-catalog-title"
              className="font-heading text-3xl font-semibold tracking-[-0.04em] text-balance sm:text-4xl sm:leading-[1.15]"
            >
              코스
            </h1>
            <p className="text-sm leading-6 text-pretty text-muted-foreground sm:text-[0.9375rem]">
              주제별로 코스를 살펴보세요
            </p>
          </div>
        </header>

        <div className="flex flex-col gap-14">
          {TOPICS.map((topic) => (
            <section
              key={topic.id}
              data-slot="learn-catalog-topic"
              aria-labelledby={`learn-catalog-topic-${topic.id}`}
              className="flex flex-col gap-5"
            >
              <header
                className={`${catalogColumnClassName} flex flex-col gap-1.5`}
              >
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

              <Carousel aria-labelledby={`learn-catalog-topic-${topic.id}`}>
                <CarouselContent className={catalogCarouselPadClassName}>
                  {topic.courses.map((course) => (
                    <CarouselItem
                      className={catalogCourseSlideClassName}
                      key={course.id}
                    >
                      <CourseCard
                        category={topic.title}
                        course={course}
                        pattern={topic.pattern}
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselControls className={catalogCarouselPadClassName}>
                  <CarouselPrevious />
                  <CarouselNext />
                  <CarouselProgress />
                </CarouselControls>
              </Carousel>
            </section>
          ))}
        </div>
      </main>
    </LearnerShell>
  )
}

export default LearnCatalog
