"use client"

import Image from "next/image"
import Link from "next/link"

import { resolveCourseImage } from "@/entities/course/model/course-visual-assets"
import {
  groupCoursesByCategory,
  type CourseCategoryGroup,
} from "@/features/course-catalog/model/group-courses-by-category"
import { type LearnerCourseSummaryDto } from "@/shared/http/learner-api-client"
import { buttonVariants } from "@workspace/ui/components/primitives/button"
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
  EmptyContent,
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
  "basis-[min(19rem,calc(100vw-4.5rem))] sm:basis-[20rem]"

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
}

export function CourseCatalogClient({ courses }: CoursesPageProps) {
  const sections = groupCoursesByCategory(courses)

  if (courses.length === 0) {
    return (
      <Empty role="status" variant="frame">
        <EmptyHeader>
          <EmptyTitle>아직 열려 있는 코스가 없습니다.</EmptyTitle>
          <EmptyDescription>
            새 코스가 공개되면 이곳에서 바로 이어갈 수 있습니다.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Link
            className={buttonVariants({ variant: "secondary" })}
            href="/app"
          >
            홈으로 돌아가기
          </Link>
        </EmptyContent>
      </Empty>
    )
  }

  const sectionViews = buildSectionViews(sections)

  return (
    <div className="flex flex-col gap-10">
      {sectionViews.map((section) => {
        const headingId = `courses-catalog-topic-${section.category}`
        return (
          <section aria-labelledby={headingId} key={section.category}>
            <Carousel
              aria-labelledby={headingId}
              className={`${catalogCarouselBreakoutClassName} gap-5`}
              opts={{ align: alignCatalogCarousel, watchDrag: true }}
            >
              <header
                className={`${catalogCarouselTrackPadClassName} flex items-center gap-3`}
              >
                <h2
                  className="min-w-0 flex-1 font-heading text-xl font-semibold tracking-[-0.01em] sm:text-2xl"
                  id={headingId}
                >
                  {section.category}
                </h2>
                <CarouselControls>
                  <CarouselPrevious />
                  <CarouselNext />
                  <CarouselProgress className="max-w-32 sm:max-w-xs" />
                </CarouselControls>
              </header>
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
            </Carousel>
          </section>
        )
      })}
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
        "h-full w-full cursor-pointer gap-0 rounded-5xl py-0 outline-none transition-[background-color,transform] duration-125 ease-press hover:bg-accent/40 focus-visible:ring-3 focus-visible:ring-ring/25 active:scale-[0.995]"
      )}
      href={`/app/courses/${course.id}`}
      onClick={guardCarouselClick}
    >
      <div className="shrink-0 p-7">
        <div className="relative aspect-square overflow-hidden rounded-3xl">
          <Image
            alt=""
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
        <p className="mt-2 line-clamp-2 text-sm font-normal leading-5 text-pretty text-foreground/80">
          {course.description}
        </p>
        <p className="mt-auto text-xs font-medium leading-4 tabular-nums text-muted-foreground">
          {course.lessonCount}개 레슨
        </p>
      </div>
    </Link>
  )
}
