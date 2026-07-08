"use client"

import Image from "next/image"
import Link from "next/link"
import { useCallback, useMemo, useState, type ReactNode } from "react"

import { CompletedCourseCard } from "@/features/home/completed-course-card"
import { createCourseImageUrl } from "@/features/courses/course-visual-assets"
import type {
  ProgressCourse,
  ProgressCourseList,
  ProgressNextLesson,
} from "@/features/courses/course-types"
import type { LearnerProfile } from "@/features/profile/profile-types"
import { getBrowserLearnerSessionToken } from "@/lib/auth/session-token"
import { getBrowserWritingAppApi } from "@/lib/api/get-browser-writing-app-api"
import type { WritingAppApi } from "@/lib/api/writing-app-api-port"
import {
  BookOpenIcon,
  ChevronRightIcon,
  FlameIcon,
  PlayIcon,
  SparklesIcon,
} from "@workspace/ui/components/icons"
import { Button, buttonVariants } from "@workspace/ui/components/ui/button"
import { Progress } from "@workspace/ui/components/ui/progress"
import { StatCard, StatGrid } from "@workspace/ui/components/ui/stat-card"
import { Surface } from "@workspace/ui/components/ui/surface"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/ui/tabs"

const CONTINUE_COURSE_LIMIT = 5

type CompletedCoursesState =
  | { readonly status: "error" }
  | { readonly status: "idle" }
  | { readonly status: "loaded"; readonly courses: readonly ProgressCourse[] }
  | { readonly status: "loading" }

type HomePageProps = {
  readonly api?: WritingAppApi
  readonly inProgress: ProgressCourseList
  readonly learnerName: null | string | undefined
  readonly profileStats: LearnerProfile["stats"]
}

export function HomePage({
  api,
  inProgress,
  learnerName,
  profileStats,
}: HomePageProps) {
  const firstName = normalizeFirstName(learnerName)
  const inProgressItems = inProgress.courses.slice(0, CONTINUE_COURSE_LIMIT)
  const resolvedApi = useMemo(
    () =>
      api ??
      getBrowserWritingAppApi({
        tokenProvider: getBrowserLearnerSessionToken,
      }),
    [api]
  )
  const [completedState, setCompletedState] = useState<CompletedCoursesState>({
    status: "idle",
  })

  const loadCompletedCourses = useCallback(async () => {
    setCompletedState({ status: "loading" })
    const result = await resolvedApi.getProgress({ status: "completed" })

    if (result.status === "error") {
      setCompletedState({ status: "error" })
      return
    }

    setCompletedState({
      courses: result.value.courses,
      status: "loaded",
    })
  }, [resolvedApi])

  const handleTabChange = useCallback(
    (value: string) => {
      if (value === "completed" && completedState.status === "idle") {
        void loadCompletedCourses()
      }
    },
    [completedState.status, loadCompletedCourses]
  )

  return (
    <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 xl:gap-14">
      <div className="lg:w-[360px] lg:shrink-0 lg:sticky lg:top-20 lg:self-start">
        <div className="mb-8">
          <p className="mb-2 text-body-sm font-bold text-muted-foreground">
            안녕하세요 👋
          </p>
          <h1 className="text-heading-lg font-black">
            {firstName}님,
            <br />
            오늘도 함께 써봐요.
          </h1>
        </div>
        <StatGrid aria-label="학습 현황" className="grid-cols-2 gap-3">
          <StatCard
            icon={<FlameIcon size={20} />}
            label="연속 학습"
            layout="compact"
            value={`${profileStats.currentStreakDays}일`}
          />
          <StatCard
            icon={<BookOpenIcon size={20} />}
            label="완료한 레슨"
            layout="compact"
            value={`${profileStats.completedLessons}개`}
          />
        </StatGrid>
      </div>

      <div className="flex-1 min-w-0">
        <Tabs
          className="flex w-full flex-col gap-4"
          defaultValue="in_progress"
          onValueChange={handleTabChange}
        >
          <TabsList className="w-fit shrink-0 self-start">
            <TabsTrigger value="in_progress">진행중</TabsTrigger>
            <TabsTrigger value="completed">완료</TabsTrigger>
          </TabsList>
          <TabsContent className="w-full flex-none" value="in_progress">
            {inProgressItems.length > 0 ? (
              <CourseCardList
                courses={inProgressItems}
                renderCard={(course, index, variant) => (
                  <ContinueCourseCard
                    course={course}
                    key={course.id}
                    priority={index === 0}
                    variant={variant}
                  />
                )}
              />
            ) : (
              <StartCourseCta />
            )}
          </TabsContent>

          <TabsContent className="w-full flex-none" value="completed">
            <CompletedCoursesPanel
              onRetry={() => {
                void loadCompletedCourses()
              }}
              state={completedState}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function CompletedCoursesPanel({
  onRetry,
  state,
}: {
  readonly onRetry: () => void
  readonly state: CompletedCoursesState
}) {
  if (state.status === "idle" || state.status === "loading") {
    return <CompletedCourseCardSkeletonList />
  }

  if (state.status === "error") {
    return (
      <div className="rounded-panel bg-surface px-6 py-8 text-center">
        <p className="mb-4 text-body-md font-bold">
          완료한 코스를 불러오지 못했어요
        </p>
        <Button onClick={onRetry} type="button" variant="secondary">
          다시 시도
        </Button>
      </div>
    )
  }

  if (state.courses.length === 0) {
    return (
      <p className="rounded-panel bg-surface px-6 py-8 text-center text-body-md font-bold text-muted-foreground">
        아직 완료한 코스가 없어요
      </p>
    )
  }

  return (
    <CourseCardList
      courses={state.courses}
      renderCard={(course, index, variant) => (
        <CompletedCourseCard
          course={course}
          key={course.id}
          priority={index === 0}
          variant={variant}
        />
      )}
    />
  )
}

function CourseCardList({
  courses,
  renderCard,
}: {
  readonly courses: readonly ProgressCourse[]
  readonly renderCard: (
    course: ProgressCourse,
    index: number,
    variant: "desktop" | "mobile"
  ) => ReactNode
}) {
  return (
    <div className="flex flex-col gap-4">
      {courses.map((course, index) => (
        <div className="w-full min-w-0" key={course.id}>
          <div className="w-full lg:hidden *:w-full *:max-w-none">
            {renderCard(course, index, "mobile")}
          </div>
          <div className="hidden w-full lg:block">
            {renderCard(course, index, "desktop")}
          </div>
        </div>
      ))}
    </div>
  )
}

function CompletedCourseCardSkeletonList() {
  return (
    <div className="flex flex-col gap-4">
      {["mobile-1", "mobile-2", "mobile-3"].map((key) => (
        <div className="w-full min-w-0" key={key}>
          <div className="w-full lg:hidden *:w-full *:max-w-none">
            <CompletedCourseCardSkeleton variant="mobile" />
          </div>
          <div className="hidden w-full lg:block">
            <CompletedCourseCardSkeleton variant="desktop" />
          </div>
        </div>
      ))}
    </div>
  )
}

function CompletedCourseCardSkeleton({
  variant,
}: {
  readonly variant: "desktop" | "mobile"
}) {
  const isDesktop = variant === "desktop"

  return (
    <Surface
      variant="panel"
      size="none"
      className={
        isDesktop
          ? "flex overflow-hidden rounded-[24px]"
          : "flex w-80 shrink-0 flex-col overflow-hidden rounded-[28px] sm:w-[22rem]"
      }
    >
      <div
        className={
          isDesktop
            ? "h-28 w-44 shrink-0 animate-pulse bg-charcoal/10"
            : "h-36 w-full animate-pulse bg-charcoal/10"
        }
      />
      <div
        className={
          isDesktop ? "flex flex-1 items-center px-5 py-4" : "px-6 py-5"
        }
      >
        <div
          className={
            isDesktop
              ? "h-5 w-3/5 animate-pulse rounded-full bg-charcoal/10"
              : "h-6 w-4/5 animate-pulse rounded-full bg-charcoal/10"
          }
        />
      </div>
    </Surface>
  )
}

function StartCourseCta() {
  return (
    <Link
      className="block cursor-pointer rounded-panel bg-surface p-7"
      href="/app/courses"
    >
      <div className="flex items-center gap-2 mb-5">
        <SparklesIcon className="text-muted-foreground" size={16} />
        <span className="text-label-md font-bold text-muted-foreground">
          지금 시작해볼까요?
        </span>
      </div>
      <h2 className="mb-7 text-heading-sm font-black">
        새로운 코스를
        <br />
        선택해 보세요
      </h2>
      <div
        className={buttonVariants({
          className: "w-full justify-between",
          size: "lg",
        })}
      >
        <span>코스 둘러보기</span>
        <ChevronRightIcon size={20} />
      </div>
    </Link>
  )
}

type ContinueCourseCardProps = {
  readonly course: ProgressCourse
  readonly priority?: boolean
  readonly variant: "desktop" | "mobile"
}

function ContinueCourseCard({
  course,
  priority = false,
  variant,
}: ContinueCourseCardProps) {
  const completedLessonCount = course.lessons.filter(
    (lesson) => lesson.status === "completed"
  ).length
  const totalLessonCount = course.lessons.length
  const progressPercent = clampProgressPercent(course.progressPercent)
  const nextLessons = course.nextLessons.slice(0, 2)
  const isDesktop = variant === "desktop"
  const courseHref = `/app/courses/${course.id}`

  return (
    <Surface
      variant="panel"
      size="none"
      className={
        isDesktop
          ? "overflow-hidden rounded-[24px] select-none"
          : "flex w-80 shrink-0 flex-col overflow-hidden rounded-[28px] select-none sm:w-[22rem]"
      }
    >
      {isDesktop ? (
        <Link className="flex cursor-pointer text-left" href={courseHref}>
          <div className="relative min-h-28 h-28 w-44 shrink-0 overflow-hidden">
            <Image
              alt={course.title}
              className="object-cover pointer-events-none"
              draggable={false}
              fill
              priority={priority}
              sizes="176px"
              src={createCourseImageUrl(course.id, 440, 320)}
              unoptimized
            />
          </div>
          <div className="flex-1 min-w-0 px-5 py-4">
            <ContinueCourseSummary
              completedLessonCount={completedLessonCount}
              course={course}
              progressPercent={progressPercent}
              totalLessonCount={totalLessonCount}
              variant={variant}
            />
          </div>
        </Link>
      ) : (
        <Link className="w-full cursor-pointer text-left" href={courseHref}>
          <div className="relative h-36 w-full overflow-hidden">
            <Image
              alt={course.title}
              className="object-cover pointer-events-none"
              draggable={false}
              fill
              priority={priority}
              sizes="(min-width: 640px) 22rem, 20rem"
              src={createCourseImageUrl(course.id, 700, 320)}
              unoptimized
            />
          </div>
          <div className="px-6 pt-5 pb-4">
            <ContinueCourseSummary
              completedLessonCount={completedLessonCount}
              course={course}
              progressPercent={progressPercent}
              totalLessonCount={totalLessonCount}
              variant={variant}
            />
          </div>
        </Link>
      )}
      <div
        className={
          isDesktop
            ? "px-3 py-3 flex flex-col gap-0.5"
            : "px-3 pb-4 flex flex-col gap-1"
        }
      >
        {nextLessons.length > 0 ? (
          nextLessons.map((lesson) => (
            <NextLessonLink
              isDesktop={isDesktop}
              key={lesson.id}
              lesson={lesson}
            />
          ))
        ) : (
          <div className="px-4 py-3 text-label-md font-bold text-muted-foreground">
            모든 레슨을 완료했어요
          </div>
        )}
      </div>
    </Surface>
  )
}

function ContinueCourseSummary({
  completedLessonCount,
  course,
  progressPercent,
  totalLessonCount,
  variant,
}: {
  readonly completedLessonCount: number
  readonly course: ProgressCourse
  readonly progressPercent: number
  readonly totalLessonCount: number
  readonly variant: "desktop" | "mobile"
}) {
  return (
    <>
      <p
        className={
          variant === "desktop"
            ? "mb-3 text-body-md font-bold"
            : "mb-3 text-title-md font-bold"
        }
        style={{
          display: "-webkit-box",
          overflow: "hidden",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: 2,
        }}
      >
        {course.title}
      </p>
      <Progress
        aria-label={`${course.title} 진행률`}
        className="items-center gap-3"
        indicatorClassName="bg-charcoal"
        trackClassName="h-2 bg-charcoal/10"
        value={progressPercent}
      >
        <span className="shrink-0 text-label-sm font-bold text-muted-foreground">
          {completedLessonCount}/{totalLessonCount}
        </span>
      </Progress>
    </>
  )
}

function NextLessonLink({
  isDesktop,
  lesson,
}: {
  readonly isDesktop: boolean
  readonly lesson: ProgressNextLesson
}) {
  return (
    <Link
      className={
        isDesktop
          ? "flex items-center gap-3 rounded-2xl px-3 py-3 text-left hover:bg-surface-hover"
          : "flex items-center gap-4 rounded-2xl px-4 py-3.5 text-left  hover:bg-surface-hover"
      }
      href={`/app/lesson?lesson_id=${encodeURIComponent(lesson.id)}`}
    >
      <span
        className={
          isDesktop
            ? "flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
            : "flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
        }
      >
        <PlayIcon fill="currentColor" size={isDesktop ? 12 : 14} />
      </span>
      <span className="flex-1 min-w-0">
        <span
          className={
            isDesktop
              ? "block truncate text-body-sm font-bold"
              : "block truncate text-body-md font-bold"
          }
        >
          {lesson.title}
        </span>
        <span
          className={
            isDesktop
              ? "mt-0.5 block text-label-sm font-bold text-muted-foreground"
              : "mt-1 block text-label-sm font-bold text-muted-foreground"
          }
        >
          {lesson.estimatedMinutes}분
        </span>
      </span>
    </Link>
  )
}

function clampProgressPercent(percent: number): number {
  return Math.min(Math.max(percent, 0), 100)
}

function normalizeFirstName(name: null | string | undefined): string {
  const trimmed = name?.trim()

  if (trimmed === undefined || trimmed.length === 0 || trimmed === "학습자") {
    return "글쓰기"
  }

  return trimmed.split(/\s+/)[0] ?? "글쓰기"
}
