import Image from "next/image"
import Link from "next/link"

import { CourseCurriculum } from "@/features/courses/course-curriculum"
import { createCourseImageUrl } from "@/features/courses/course-visual-assets"
import type { CourseDetail } from "@/features/courses/course-types"
import { ChevronLeftIcon } from "@workspace/ui/components/icons"
import { buttonVariants } from "@workspace/ui/components/ui/button"
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@workspace/ui/components/ui/progress"
import { Surface } from "@workspace/ui/components/ui/surface"

type CourseDetailPageProps = {
  readonly course: CourseDetail
}

export function CourseDetailPage({ course }: CourseDetailPageProps) {
  const completedLessonCount = course.progress.completedLessons
  const totalLessonCount = course.progress.totalLessons
  const progressPercent =
    totalLessonCount === 0 ? 0 : (completedLessonCount / totalLessonCount) * 100
  const nextLesson = course.progress.nextLesson

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        className="mb-8 flex w-fit items-center text-label-md font-bold text-muted-foreground btn-squish hover:text-foreground"
        href="/app/courses"
      >
        <ChevronLeftIcon className="mr-1" size={20} />
        돌아가기
      </Link>
      <Surface
        className="-mx-3 mb-12 px-5 py-8 border-none md:mx-0 md:p-10 rounded-4xl"
        size="none"
        variant="panel"
      >
        <div className="flex items-start justify-between gap-4 mb-6">
          <Image
            alt={course.title}
            className="w-24 h-24 md:w-32 md:h-32 rounded-2xl md:rounded-3xl object-cover shrink-0"
            height={128}
            priority
            sizes="(max-width: 768px) 96px, 128px"
            src={createCourseImageUrl(course.visualKey)}
            width={128}
          />
        </div>
        <h1 className="mb-4 text-heading-xl font-bold">{course.title}</h1>
        <p className="mb-8 text-body-lg font-medium text-foreground">
          {course.description}
        </p>
        <Progress value={progressPercent} className="mb-10">
          <ProgressLabel className="text-sm font-medium text-muted-foreground">
            진행도
          </ProgressLabel>
          <ProgressValue className="text-lg font-bold" />
        </Progress>
        {nextLesson === null ? null : (
          <div>
            <p className="mb-4 text-label-md font-bold text-muted-foreground">
              {completedLessonCount > 0 ? "다음 레슨" : "첫 번째 레슨"}:{" "}
              {nextLesson.title}
            </p>
            <Link
              className={buttonVariants({
                className:
                  "w-full rounded-full px-10 md:w-auto h-auto py-5 text-lg font-bold",
                size: "lg",
              })}
              href={`/app/lesson?lesson_id=${encodeURIComponent(nextLesson.id)}`}
            >
              {completedLessonCount > 0 ? "이어서 학습하기" : "학습 시작하기"}
            </Link>
          </div>
        )}
      </Surface>
      <CourseCurriculum course={course} />
    </div>
  )
}
