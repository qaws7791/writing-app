import type { ReactNode } from "react"

import { Button } from "@workspace/ui/components/ui/button"
import { Card } from "@workspace/ui/components/ui/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/ui/empty"

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
      <Empty role="alert" variant="frame">
        <EmptyHeader>
          <EmptyTitle>완료한 코스를 불러오지 못했습니다.</EmptyTitle>
          <EmptyDescription>{state.message}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={onRetry} type="button" variant="secondary">
            다시 시도
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  if (state.courses.length === 0) {
    return (
      <Empty role="status" variant="frame">
        <EmptyHeader>
          <EmptyTitle>아직 완료한 코스가 없습니다.</EmptyTitle>
          <EmptyDescription>
            진행 중인 코스를 마치면 이곳에서 다시 볼 수 있습니다.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
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
            <p className="text-sm font-medium text-destructive" role="alert">
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
    <Card
      aria-hidden="true"
      className="w-full gap-0 py-0 lg:flex-row"
      size="sm"
    >
      <div className="h-36 w-full animate-pulse bg-muted lg:h-28 lg:w-44 lg:shrink-0" />
      <div className="px-6 py-5 lg:flex lg:flex-1 lg:items-center lg:px-5 lg:py-4">
        <div className="h-5 w-4/5 animate-pulse rounded-full bg-muted lg:w-3/5" />
      </div>
    </Card>
  )
}
