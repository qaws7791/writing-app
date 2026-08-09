"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useState } from "react"

import { getCourses } from "@workspace/http-client/learner"
import { resolveCourseImage } from "@/entities/course/model/course-visual-assets"
import type { CourseListFilters } from "@/features/course-catalog/model/course-list-filters"
import {
  isLearnerApiAbortedError,
  isLearnerApiAuthenticationError,
  settleLearnerApiRequest,
  type LearnerCourseSummaryDto,
} from "@/shared/http/learner-api-client"
import { useUnmountAbortSignal } from "@/shared/http/use-unmount-abort-signal"
import { Button, buttonVariants } from "@workspace/ui/components/ui/button"
import { cardVariants } from "@workspace/ui/components/ui/card"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@workspace/ui/components/ui/empty"
import { cn } from "@workspace/ui/lib/utils"

const eagerCourseImageCount = 3

export type CoursesPageProps = {
  readonly categories: readonly string[]
  readonly courses: readonly LearnerCourseSummaryDto[]
  readonly filters: CourseListFilters
  readonly nextCursor?: string | null
}

export function CourseCatalogClient({
  categories,
  courses,
  filters,
  nextCursor: initialNextCursor = null,
}: CoursesPageProps) {
  const router = useRouter()
  const readAbortSignal = useUnmountAbortSignal()
  const [visibleCourses, setVisibleCourses] = useState(courses)
  const [nextCursor, setNextCursor] = useState(initialNextCursor)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null)

  const loadMore = useCallback(async () => {
    if (nextCursor === null || isLoadingMore) return
    setIsLoadingMore(true)
    setLoadMoreError(null)
    const result = await settleLearnerApiRequest(
      getCourses(
        {
          ...(filters.category === "" ? {} : { category: filters.category }),
          cursor: nextCursor,
        },
        { signal: readAbortSignal() }
      )
    )
    setIsLoadingMore(false)
    if (result.status === "error") {
      if (isLearnerApiAbortedError(result.error)) return
      if (isLearnerApiAuthenticationError(result.error)) {
        router.refresh()
        return
      }
      setLoadMoreError(result.error.message)
      return
    }
    setVisibleCourses((current) => [
      ...current,
      ...result.value.items.filter(
        (item) => !current.some((existing) => existing.id === item.id)
      ),
    ])
    setNextCursor(result.value.nextCursor)
  }, [filters.category, isLoadingMore, nextCursor, readAbortSignal, router])

  return (
    <div>
      {visibleCourses.length === 0 && filters.category === "" ? (
        <Empty role="status" variant="frame">
          <EmptyHeader>
            <EmptyTitle>아직 열려 있는 코스가 없습니다.</EmptyTitle>
            <EmptyDescription>
              새 코스가 공개되면 이곳에서 바로 이어갈 수 있습니다.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <div
            aria-label="코스 카테고리"
            className="no-scrollbar -mx-5 mb-8 flex gap-2 overflow-x-auto overscroll-x-contain px-5 pb-2 sm:-mx-8 sm:px-8"
            role="group"
          >
            {["", ...categories].map((category) => (
              <Button
                aria-pressed={filters.category === category}
                className="shrink-0"
                key={category}
                onClick={() => router.push(createCoursesHref(category))}
                type="button"
                variant={
                  filters.category === category ? "default" : "secondary"
                }
              >
                {category === "" ? "전체" : category}
              </Button>
            ))}
          </div>
          {visibleCourses.length === 0 ? (
            <Empty role="status" variant="frame">
              <EmptyHeader>
                <EmptyTitle>이 카테고리에는 코스가 없습니다.</EmptyTitle>
                <EmptyDescription>
                  전체 코스에서 다른 글쓰기 주제를 살펴보세요.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Link className={buttonVariants()} href="/app/courses">
                  전체 코스 보기
                </Link>
              </EmptyContent>
            </Empty>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {visibleCourses.map((course, index) => (
                  <Link
                    className={cn(
                      cardVariants({ size: "sm", variant: "muted" }),
                      "w-full flex-row items-stretch gap-0 py-0 text-left outline-none hover:bg-muted/80 focus-visible:ring-3 focus-visible:ring-ring/25 md:flex-col"
                    )}
                    href={`/app/courses/${course.id}`}
                    key={course.id}
                  >
                    <div className="relative w-28 shrink-0 md:w-full md:h-44">
                      <Image
                        alt={resolveCourseImage(course).alt}
                        draggable="false"
                        className="object-cover select-none"
                        fill
                        loading={
                          index < eagerCourseImageCount ? "eager" : "lazy"
                        }
                        preload={index === 0}
                        sizes="(max-width: 768px) 112px, (max-width: 1024px) 50vw, 33vw"
                        src={resolveCourseImage(course).src}
                      />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col p-4 md:p-6">
                      <h2 className="font-heading text-base font-semibold tracking-[-0.014em]">
                        {course.title}
                      </h2>
                      <p className="mt-2 hidden text-sm leading-6 text-muted-foreground md:block">
                        {course.description}
                      </p>
                      <div className="mt-auto pt-3 text-xs font-medium text-foreground/80">
                        {course.lessonCount}개 레슨
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              {nextCursor === null ? null : (
                <div className="mt-8 flex flex-col items-center gap-2">
                  {loadMoreError === null ? null : (
                    <p
                      className="text-sm font-medium text-destructive"
                      role="alert"
                    >
                      {loadMoreError}
                    </p>
                  )}
                  <Button
                    disabled={isLoadingMore}
                    onClick={() => void loadMore()}
                    type="button"
                    variant="secondary"
                  >
                    {isLoadingMore ? "불러오는 중" : "코스 더 보기"}
                  </Button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

function createCoursesHref(category: string): string {
  return category === ""
    ? "/app/courses"
    : `/app/courses?${new URLSearchParams({ category }).toString()}`
}
