import Image from "next/image"
import Link from "next/link"

import { CourseCurriculum } from "@/features/course-detail/ui/course-curriculum"
import { resolveCourseImage } from "@/entities/course/model/course-visual-assets"
import type { LearnerCourseDetailDto } from "@/shared/http/learner-api-client"
import { ChevronLeftIcon } from "@workspace/ui/components/icons"
import { buttonVariants } from "@workspace/ui/components/ui/button"
import { Surface } from "@workspace/ui/components/ui/surface"

type CourseDetailPageProps = {
  readonly course: LearnerCourseDetailDto
}

export function CourseDetailPage({ course }: CourseDetailPageProps) {
  const completedLessonCount = course.learning.completedLessons
  const totalLessonCount = course.learning.totalLessons
  const progressPercent = course.learning.progressPercent
  const nextLesson = course.learning.nextLesson

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        className={buttonVariants({
          className:
            "mb-8 h-auto w-fit justify-start rounded-sm border-0 bg-transparent p-0 text-label-md text-muted-foreground no-underline hover:bg-transparent hover:text-foreground hover:no-underline",
          size: "sm",
          variant: "link",
        })}
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
            alt={resolveCourseImage(course).alt}
            className="w-24 h-24 md:w-32 md:h-32 rounded-2xl md:rounded-3xl object-cover shrink-0"
            height={128}
            loading="eager"
            sizes="(max-width: 768px) 96px, 128px"
            src={resolveCourseImage(course).src}
            width={128}
          />
        </div>
        <h1 className="mb-4 text-heading-xl font-bold">{course.title}</h1>
        <p className="mb-8 text-body-lg font-medium text-fg-default leading-relaxed">
          {course.description}
        </p>
        <div className="mb-10 flex items-center gap-6">
          <div className="h-4 flex-1 overflow-hidden rounded-full bg-bg-surface">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-title-md font-black">
            {completedLessonCount}/{totalLessonCount}
          </span>
        </div>
        {nextLesson === null ? null : (
          <div>
            <p className="mb-4 text-label-md font-bold text-muted-foreground">
              {completedLessonCount > 0 ? "다음 레슨" : "첫 번째 레슨"}:{" "}
              {nextLesson.title}
            </p>
            <Link
              className={buttonVariants({
                className:
                  "w-full rounded-full bg-action-primary-bg px-10 text-action-primary-fg md:w-auto h-auto py-5 text-lg font-bold hover:opacity-90",
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
