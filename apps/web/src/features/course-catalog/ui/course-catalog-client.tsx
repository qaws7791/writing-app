"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useState } from "react"

import { getCourses } from "@workspace/http-client/learner"
import { resolveCourseImage } from "@/entities/course/model/course-visual-assets"
import {
  groupCoursesByCategory,
  type CourseCategoryGroup,
} from "@/features/course-catalog/model/group-courses-by-category"
import {
  isLearnerApiAbortedError,
  isLearnerApiAuthenticationError,
  settleLearnerApiRequest,
  type LearnerCourseSummaryDto,
} from "@/shared/http/learner-api-client"
import { useUnmountAbortSignal } from "@/shared/http/use-unmount-abort-signal"
import { Button } from "@workspace/ui/components/primitives/button"
import { cardVariants } from "@workspace/ui/components/primitives/card"
import {
  Carousel,
  CarouselContent,
  CarouselControls,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselProgress,
  useCarouselClickGuard,
} from "@workspace/ui/components/primitives/carousel"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@workspace/ui/components/primitives/empty"
import { cn } from "@workspace/ui/lib/utils"

const eagerCourseImageCount = 3
const catalogCarouselBreakoutClassName =
  "-mx-[max(1.25rem,calc((100vw-64rem)/2+1.25rem))] w-[100vw] max-w-[100vw] sm:-mx-[max(2rem,calc((100vw-64rem)/2+2rem))]"
const catalogCarouselTrackPadClassName =
  "pl-[max(1.25rem,calc((100vw-64rem)/2+1.25rem))] pr-[max(1.25rem,calc((100vw-64rem)/2+1.25rem))] sm:pl-[max(2rem,calc((100vw-64rem)/2+2rem))] sm:pr-[max(2rem,calc((100vw-64rem)/2+2rem))]"
const catalogCarouselContentClassName = `${catalogCarouselTrackPadClassName} gap-3 sm:gap-6`
const catalogCourseSlideClassName =
  "basis-[min(19rem,calc(100vw-4.5rem))] last:me-[max(1.25rem,calc((100vw-64rem)/2+1.25rem))] sm:basis-[20rem] sm:last:me-[max(2rem,calc((100vw-64rem)/2+2rem))]"

function alignCatalogCarousel(
  viewSize: number,
  _snapSize: number,
  _index: number
) {
  const baseInset = viewSize < 640 ? 20 : 32
  return Math.max(baseInset, (viewSize - 1024) / 2 + baseInset)
}

export type CoursesPageProps = {
  readonly courses: readonly LearnerCourseSummaryDto[]
  readonly nextCursor?: string | null
}

export function CourseCatalogClient({
  courses,
  nextCursor: initialNextCursor = null,
}: CoursesPageProps) {
  const router = useRouter()
  const readAbortSignal = useUnmountAbortSignal()
  const [visibleCourses, setVisibleCourses] = useState(courses)
  const [nextCursor, setNextCursor] = useState(initialNextCursor)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null)

  const sections = groupCoursesByCategory(visibleCourses)

  const loadMore = useCallback(async () => {
    if (nextCursor === null || isLoadingMore) return
    setIsLoadingMore(true)
    setLoadMoreError(null)
    const result = await settleLearnerApiRequest(
      getCourses(
        {
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
  }, [isLoadingMore, nextCursor, readAbortSignal, router])

  if (visibleCourses.length === 0) {
    return (
      <Empty role="status" variant="frame">
        <EmptyHeader>
          <EmptyTitle>아직 열려 있는 코스가 없습니다.</EmptyTitle>
          <EmptyDescription>
            새 코스가 공개되면 이곳에서 바로 이어갈 수 있습니다.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  const sectionViews = buildSectionViews(sections)

  return (
    <div className="flex flex-col gap-14">
      {sectionViews.map((section) => {
        const headingId = `courses-catalog-topic-${section.category}`
        return (
          <section
            aria-labelledby={headingId}
            className="flex flex-col gap-5"
            key={section.category}
          >
            <header className="flex flex-col gap-1.5">
              <h2
                className="font-heading text-xl font-semibold tracking-[-0.01em] sm:text-2xl"
                id={headingId}
              >
                {section.category}
              </h2>
            </header>
            <Carousel
              aria-labelledby={headingId}
              className={catalogCarouselBreakoutClassName}
              opts={{ align: alignCatalogCarousel, watchDrag: true }}
            >
              <CarouselContent className={catalogCarouselContentClassName}>
                {section.courses.map(({ course, imageIndex }) => (
                  <CarouselItem
                    className={catalogCourseSlideClassName}
                    key={course.id}
                  >
                    <CourseCard
                      course={course}
                      eager={imageIndex < eagerCourseImageCount}
                      preload={imageIndex === 0}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselControls className={catalogCarouselTrackPadClassName}>
                <CarouselPrevious />
                <CarouselNext />
                <CarouselProgress className="max-w-xs sm:max-w-sm" />
              </CarouselControls>
            </Carousel>
          </section>
        )
      })}
      {nextCursor === null ? null : (
        <div className="flex flex-col items-center gap-2">
          {loadMoreError === null ? null : (
            <p className="text-sm font-medium text-destructive" role="alert">
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
    </div>
  )
}

function buildSectionViews(
  sections: readonly CourseCategoryGroup<LearnerCourseSummaryDto>[]
) {
  let imageIndex = 0
  return sections.map((section) => ({
    category: section.category,
    courses: section.courses.map((course) => {
      const currentImageIndex = imageIndex
      imageIndex += 1
      return { course, imageIndex: currentImageIndex }
    }),
  }))
}

function CourseCard({
  course,
  eager,
  preload,
}: {
  readonly course: LearnerCourseSummaryDto
  readonly eager: boolean
  readonly preload: boolean
}) {
  const image = resolveCourseImage(course)
  const guardCarouselClick = useCarouselClickGuard()

  return (
    <Link
      className={cn(
        cardVariants({ variant: "surface" }),
        "aspect-[340/520] h-full w-full gap-0 rounded-5xl py-0 outline-none transition-colors hover:bg-accent/40 focus-visible:ring-3 focus-visible:ring-ring/25"
      )}
      href={`/app/courses/${course.id}`}
      onClick={guardCarouselClick}
    >
      <div className="shrink-0 p-7">
        <div className="relative aspect-square overflow-hidden rounded-3xl">
          <Image
            alt={image.alt}
            className="object-cover select-none"
            draggable="false"
            fill
            loading={eager ? "eager" : "lazy"}
            preload={preload}
            sizes="(max-width: 640px) calc(100vw - 4rem), 284px"
            src={image.src}
          />
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col px-6 pb-6">
        <h3 className="line-clamp-3 font-heading text-xl font-normal leading-7">
          {course.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm font-normal leading-5 text-pretty text-muted-foreground">
          {course.description}
        </p>
        <p className="mt-auto text-sm font-medium leading-5 tabular-nums text-muted-foreground">
          {course.lessonCount}개 레슨
        </p>
      </div>
    </Link>
  )
}
