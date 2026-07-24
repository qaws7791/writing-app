import type { ReactNode } from "react"

import { Button } from "@workspace/ui/components/ui/button"
import { Surface } from "@workspace/ui/components/ui/surface"

import { CompletedCourseCard } from "@/features/learner-home/ui/completed-course-card"
import type { CompletedCoursesState } from "@/features/learner-home/model/home-progress-state"
import type { LearnerProgressCourseDto } from "@/shared/http/learner-api-client"

export function CompletedCoursesPanel({
  onLoadMore,
  onRetry,
  state,
}: {
  readonly onLoadMore: () => void
  readonly onRetry: () => void
  readonly state: CompletedCoursesState
}) {
  if (state.status === "idle" || state.status === "loading") {
    return <CompletedCourseCardSkeletonList />
  }

  if (state.status === "error") {
    return (
      <div className="rounded-panel bg-surface px-6 py-8 text-center">
        <p className="mb-4 text-body-md font-bold">{state.message}</p>
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
    <ProgressCourseList
      courses={state.courses}
      loadMoreError={state.loadMoreError}
      loadMoreLabel="완료한 코스 더 보기"
      loadMoreStatus={state.loadMoreStatus}
      nextCursor={state.nextCursor}
      onLoadMore={onLoadMore}
      renderCard={(course, index) => (
        <CompletedCourseCard
          course={course}
          key={course.id}
          priority={index === 0}
        />
      )}
    />
  )
}

export function ProgressCourseList({
  courses,
  loadMoreError,
  loadMoreLabel,
  loadMoreStatus,
  nextCursor,
  onLoadMore,
  renderCard,
}: {
  readonly courses: readonly LearnerProgressCourseDto[]
  readonly loadMoreLabel: string
  readonly loadMoreStatus: "error" | "idle" | "loading"
  readonly nextCursor: string | null
  readonly onLoadMore: () => void
  readonly renderCard: (
    course: LearnerProgressCourseDto,
    index: number
  ) => ReactNode
  readonly loadMoreError?: string | null
}) {
  return (
    <div className="flex flex-col gap-4">
      {courses.map((course, index) => (
        <div className="w-full min-w-0" key={course.id}>
          {renderCard(course, index)}
        </div>
      ))}
      {nextCursor !== null ? (
        <div className="flex flex-col items-center gap-2 pt-2">
          {loadMoreStatus === "error" ? (
            <p className="text-body-sm font-bold text-destructive">
              {loadMoreError ?? "코스를 더 불러오지 못했어요"}
            </p>
          ) : null}
          <Button
            disabled={loadMoreStatus === "loading"}
            onClick={onLoadMore}
            type="button"
            variant="secondary"
          >
            {loadMoreStatus === "loading" ? "불러오는 중..." : loadMoreLabel}
          </Button>
        </div>
      ) : null}
    </div>
  )
}

function CompletedCourseCardSkeletonList() {
  return (
    <div className="flex flex-col gap-4">
      {["mobile-1", "mobile-2", "mobile-3"].map((key) => (
        <div className="w-full min-w-0" key={key}>
          <CompletedCourseCardSkeleton />
        </div>
      ))}
    </div>
  )
}

function CompletedCourseCardSkeleton() {
  return (
    <Surface
      variant="panel"
      size="none"
      className="flex w-full flex-col overflow-hidden rounded-[28px] lg:flex-row lg:rounded-[24px]"
    >
      <div className="h-36 w-full animate-pulse bg-bg-surface lg:h-28 lg:w-44 lg:shrink-0" />
      <div className="px-6 py-5 lg:flex lg:flex-1 lg:items-center lg:px-5 lg:py-4">
        <div className="h-6 w-4/5 animate-pulse rounded-full bg-bg-surface lg:h-5 lg:w-3/5" />
      </div>
    </Surface>
  )
}
