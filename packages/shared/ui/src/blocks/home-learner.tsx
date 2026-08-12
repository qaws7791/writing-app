"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  BookOpen01Icon,
  Calendar01Icon,
  PlayIcon,
} from "@hugeicons/core-free-icons"

import { cn } from "#ui/lib/utils"
import { LearnerShell } from "#ui/blocks/learner-shell"
import { Card, cardVariants } from "#ui/components/primitives/card"
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "#ui/components/primitives/progress"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "#ui/components/primitives/tabs"

type CourseProgress = {
  id: string
  genre: string
  title: string
  completedLessons: number
  totalLessons: number
  nextLesson: {
    title: string
    duration: string
  }
}

type CompletedCourse = {
  id: string
  genre: string
  title: string
  totalLessons: number
}

const IN_PROGRESS: CourseProgress[] = [
  {
    id: "vocab-meaning",
    genre: "읽기",
    title: "어휘와 문장의 의미 정확히 읽기",
    completedLessons: 0,
    totalLessons: 20,
    nextLesson: {
      title: "문맥 단서의 종류 찾기",
      duration: "8분",
    },
  },
]

const COMPLETED: CompletedCourse[] = [
  {
    id: "greetings",
    genre: "회화",
    title: "인사와 자기소개",
    totalLessons: 8,
  },
]

function StatCard({
  icon,
  value,
  label,
}: {
  icon: typeof Calendar01Icon
  value: string
  label: string
}) {
  return (
    <Card
      variant="muted"
      size="sm"
      data-slot="home-learner-stat"
      className="min-w-0 flex-1 flex-row items-center gap-3 rounded-3xl px-(--card-spacing) py-3.5"
    >
      <span
        className="grid size-9 shrink-0 place-items-center rounded-2xl bg-background text-muted-foreground"
        aria-hidden="true"
      >
        <HugeiconsIcon icon={icon} strokeWidth={2} className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="font-heading text-base font-semibold tracking-[-0.02em] tabular-nums">
          {value}
        </p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </Card>
  )
}

function CourseMark({ genre }: { genre: string }) {
  return (
    <div
      data-slot="home-learner-course-mark"
      className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-muted @[32rem]:size-24"
      aria-hidden="true"
    >
      <span className="absolute inset-3 rounded-2xl border border-border/60" />
      <span className="absolute top-5 left-5 size-2.5 rounded-full bg-foreground/25" />
      <span className="absolute right-6 bottom-6 size-3 rounded-md bg-foreground/15" />
      <span className="absolute top-1/2 left-1/2 size-8 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-dashed border-foreground/20" />
      <span className="relative z-10 text-[0.65rem] font-medium tracking-[0.06em] text-muted-foreground uppercase">
        {genre.slice(0, 2)}
      </span>
    </div>
  )
}

function InProgressCourseCard({ course }: { course: CourseProgress }) {
  const percent = Math.round(
    (course.completedLessons / course.totalLessons) * 100
  )

  return (
    <article
      data-slot="home-learner-course-card"
      data-variant="surface"
      data-size="sm"
      className={cn(
        cardVariants({ variant: "surface", size: "sm" }),
        "gap-5 rounded-[1.75rem]"
      )}
    >
      <div className="flex items-start gap-4 px-(--card-spacing) sm:gap-5">
        <CourseMark genre={course.genre} />
        <div className="min-w-0 flex-1 pt-0.5">
          <h3 className="font-heading text-base font-semibold tracking-[-0.025em] text-balance sm:text-lg">
            {course.title}
          </h3>
          <Progress value={percent} className="mt-3 gap-1.5">
            <ProgressLabel className="sr-only">
              {course.title} 진행
            </ProgressLabel>
            <ProgressValue className="text-xs tabular-nums text-muted-foreground">
              {() => `${course.completedLessons}/${course.totalLessons}`}
            </ProgressValue>
          </Progress>
        </div>
      </div>

      <div className="px-(--card-spacing)">
        <button
          type="button"
          data-slot="home-learner-next-lesson"
          className={cn(
            "flex w-full items-center gap-3.5 rounded-3xl px-3.5 py-3 text-left transition-[background-color,transform] duration-125 ease-press",
            "hover:bg-accent active:scale-[0.995]",
            "focus-visible:ring-3 focus-visible:ring-ring/25 focus-visible:outline-none"
          )}
          aria-label={`${course.nextLesson.title} 시작, ${course.nextLesson.duration}`}
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-foreground text-background">
            <HugeiconsIcon
              icon={PlayIcon}
              strokeWidth={2}
              className="size-4 translate-x-px"
            />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium tracking-[-0.01em] text-pretty">
              {course.nextLesson.title}
            </span>
            <span className="mt-0.5 block text-xs tabular-nums text-muted-foreground">
              {course.nextLesson.duration}
            </span>
          </span>
        </button>
      </div>
    </article>
  )
}

function CompletedCourseCard({ course }: { course: CompletedCourse }) {
  return (
    <article
      data-slot="home-learner-completed-card"
      data-variant="surface"
      data-size="sm"
      className={cn(
        cardVariants({ variant: "surface", size: "sm" }),
        "flex-row items-center gap-4 rounded-[1.75rem] py-4"
      )}
    >
      <div className="flex w-full items-center gap-4 px-(--card-spacing)">
        <CourseMark genre={course.genre} />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium tracking-[0.04em] text-muted-foreground uppercase">
            {course.genre}
            <span className="mx-1.5 text-border" aria-hidden="true">
              ·
            </span>
            <span className="tabular-nums normal-case tracking-normal">
              완료
            </span>
          </p>
          <h3 className="mt-1 font-heading text-base font-semibold tracking-[-0.02em] text-balance">
            {course.title}
          </h3>
          <p className="mt-1 text-xs tabular-nums text-muted-foreground">
            {course.totalLessons}레슨
          </p>
        </div>
      </div>
    </article>
  )
}

/**
 * Logged-in learner home: greeting + quiet stats beside a tabbed course progress card.
 */
export function HomeLearner({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <LearnerShell
      data-slot="home-learner"
      className={className}
      currentNav="home"
      {...props}
    >
      <main className="@container mx-auto grid w-full max-w-5xl flex-1 grid-cols-1 gap-10 px-5 py-10 sm:px-8 sm:py-12 @[48rem]/learner-shell:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] @[48rem]/learner-shell:items-start @[48rem]/learner-shell:gap-12">
        <section
          data-slot="home-learner-greeting"
          className="flex flex-col gap-8"
          aria-labelledby="home-learner-hello"
        >
          <header className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">안녕하세요</p>
            <h1
              id="home-learner-hello"
              className="font-heading text-3xl font-semibold tracking-[-0.04em] text-balance sm:text-4xl sm:leading-[1.15]"
            >
              민지님, 오늘도
              <br className="hidden @[32rem]:block" /> 이어서 배워 볼까요
            </h1>
          </header>

          <div className="flex flex-col gap-3 @[32rem]:flex-row">
            <StatCard icon={Calendar01Icon} value="1일" label="연속 학습" />
            <StatCard icon={BookOpen01Icon} value="0개" label="완료한 레슨" />
          </div>
        </section>

        <section data-slot="home-learner-courses" aria-label="학습 진행">
          <Tabs defaultValue="in-progress" className="gap-4">
            <TabsList>
              <TabsTrigger value="in-progress">진행중</TabsTrigger>
              <TabsTrigger value="completed">완료</TabsTrigger>
            </TabsList>

            <TabsContent
              value="in-progress"
              className="flex flex-col gap-3 outline-none"
            >
              {IN_PROGRESS.map((course) => (
                <InProgressCourseCard key={course.id} course={course} />
              ))}
            </TabsContent>

            <TabsContent
              value="completed"
              className="flex flex-col gap-3 outline-none"
            >
              {COMPLETED.length > 0 ? (
                COMPLETED.map((course) => (
                  <CompletedCourseCard key={course.id} course={course} />
                ))
              ) : (
                <Card
                  variant="muted"
                  size="sm"
                  className="rounded-[1.75rem] px-(--card-spacing) py-8 text-sm text-muted-foreground"
                >
                  아직 완료한 코스가 없습니다.
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </section>
      </main>
    </LearnerShell>
  )
}

export default HomeLearner
