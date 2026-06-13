import Link from "next/link"

import { CourseCurriculum } from "@/features/courses/course-curriculum"
import type {
  CourseDetail,
  ProgressCourse,
} from "@/features/courses/course-types"
import { buttonVariants } from "@workspace/ui/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/ui/card"
import { Progress } from "@workspace/ui/components/ui/progress"
import { ArrowRightIcon } from "@workspace/ui/components/icons"

type CourseDetailPageProps = {
  readonly course: CourseDetail
  readonly progressCourse?: ProgressCourse
}

export function CourseDetailPage({
  course,
  progressCourse,
}: CourseDetailPageProps) {
  const progressPercent =
    progressCourse?.progressPercent ?? course.progressPercent
  const nextLesson = progressCourse?.nextLessons[0]

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10 sm:px-8 lg:px-10">
        <section className="grid gap-6 lg:grid-cols-[1fr_22rem]">
          <div className="flex flex-col gap-4">
            <p className="text-sm font-medium text-primary">
              {course.category}
            </p>
            <h1 className="text-3xl font-semibold">{course.title}</h1>
            <p className="max-w-3xl leading-7 text-muted-foreground">
              {course.description}
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle as="h2">학습 진행</CardTitle>
              <CardDescription>{progressPercent}% 완료</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Progress
                aria-label={`${course.title} 진행률`}
                value={progressPercent}
              />
              <p className="text-sm text-muted-foreground">
                {course.progress.completedLessons}/
                {course.progress.totalLessons}개 레슨 완료
              </p>
              {nextLesson === undefined ? (
                <Link
                  className={buttonVariants({ variant: "outline" })}
                  href="/app/courses"
                >
                  다른 코스 보기
                </Link>
              ) : (
                <Link
                  aria-label={`${nextLesson.title} 이어하기`}
                  className={buttonVariants()}
                  href={`/app/lesson?lesson_id=${nextLesson.id}`}
                >
                  {nextLesson.title} 이어하기
                  <ArrowRightIcon data-icon="inline-end" />
                </Link>
              )}
            </CardContent>
          </Card>
        </section>

        <CourseCurriculum course={course} progressCourse={progressCourse} />
      </div>
    </main>
  )
}
