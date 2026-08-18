import Image from "next/image"
import Link from "next/link"

import { resolveCourseImage } from "@/entities/course/model/course-visual-assets"
import { CourseCurriculum } from "@/features/course-detail/ui/course-curriculum"
import type { LearnerCourseDetailDto } from "@/shared/http/learner-api-client"
import { ChevronLeftIcon } from "@workspace/ui/components/icons/direction-icons"
import { buttonVariants } from "@workspace/ui/components/primitives/button"
import { Card, CardContent } from "@workspace/ui/components/primitives/card"
import {
  Progress,
  ProgressLabel,
} from "@workspace/ui/components/primitives/progress"

type CourseDetailPageProps = {
  readonly course: LearnerCourseDetailDto
}

export function CourseDetailPage({ course }: CourseDetailPageProps) {
  const completedLessonCount = course.learning.completedLessons
  const totalLessonCount = course.learning.totalLessons
  const progressPercent = course.learning.progressPercent
  const nextLesson = course.learning.nextLesson
  const totalEstimatedMinutes = course.units.reduce(
    (total, unit) =>
      total +
      unit.lessons.reduce(
        (unitTotal, lesson) => unitTotal + lesson.estimatedMinutes,
        0
      ),
    0
  )

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        className="mb-7 inline-flex min-h-10 items-center gap-1.5 rounded-lg text-sm font-medium text-foreground/80 outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/25"
        href="/app/courses"
      >
        <ChevronLeftIcon aria-hidden="true" className="size-4" />
        코스 목록으로
      </Link>
      <Card
        className="mb-12 pt-0 dark:shadow-xs sm:pt-(--card-spacing)"
        size="lg"
        variant="muted"
      >
        <CardContent className="grid gap-7 px-0 sm:grid-cols-[minmax(13rem,16rem)_minmax(0,1fr)] sm:items-stretch sm:px-(--card-spacing)">
          <Image
            alt={resolveCourseImage(course).alt}
            className="aspect-square h-auto w-full object-cover sm:aspect-auto sm:h-full sm:min-h-52 sm:rounded-3xl"
            height={320}
            loading="eager"
            sizes="(max-width: 640px) 100vw, 256px"
            src={resolveCourseImage(course).src}
            width={320}
          />
          <div className="min-w-0 px-(--card-spacing) sm:px-0">
            <h1 className="font-heading text-3xl leading-tight font-semibold tracking-[-0.01em] sm:text-4xl">
              {course.title}
            </h1>
            <p className="mt-4 text-base leading-7 text-foreground/80">
              {course.description}
            </p>
            <Progress
              aria-label={`${course.title} 진행률`}
              className="mt-7 [&_[data-slot=progress-indicator]]:min-w-0"
              value={progressPercent}
            >
              <ProgressLabel className="sr-only">
                {course.title} 진행률
              </ProgressLabel>
              <span aria-hidden="true" className="text-sm font-medium">
                학습 진행
              </span>
              <span className="ml-auto text-sm font-medium text-muted-foreground tabular-nums">
                {completedLessonCount}/{totalLessonCount}개 레슨
                <span aria-hidden="true" className="mx-1.5 font-normal">
                  ·
                </span>
                약 {totalEstimatedMinutes}분
              </span>
            </Progress>
            {nextLesson === null ? null : (
              <div className="mt-8">
                <p className="mb-4 text-sm font-medium leading-6 text-foreground">
                  <span className="block">
                    {completedLessonCount > 0 ? "다음 레슨" : "첫 번째 레슨"}
                  </span>
                  <span className="mt-1 block">{nextLesson.title}</span>
                </p>
                <Link
                  className={buttonVariants({
                    className: "w-full",
                    size: "lg",
                  })}
                  href={`/app/lesson?lesson_id=${encodeURIComponent(nextLesson.id)}`}
                >
                  {completedLessonCount > 0
                    ? "이어서 학습하기"
                    : "학습 시작하기"}
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <CourseCurriculum
        course={course}
        currentLessonId={nextLesson?.id ?? null}
      />
    </div>
  )
}
