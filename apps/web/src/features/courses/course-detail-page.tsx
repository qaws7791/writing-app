import * as React from "react"
import Image from "next/image"
import Link from "next/link"

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@workspace/ui/components/ui/card"
import { Button } from "@workspace/ui/components/ui/button"
import { ProgressBar } from "@workspace/ui/components/ui/progress-bar"
import { Separator } from "@workspace/ui/components/ui/separator"
import { PlayIcon } from "@workspace/ui/components/icons"

import { CourseCurriculum } from "@/features/courses/course-curriculum"
import { CourseUpgradeNotice } from "@/features/courses/course-upgrade-notice"
import type { CourseDetail } from "@/features/courses/course-detail-data"
import type { CurriculumUpgradeNotice } from "@/lib/api/writing-app-api"

interface CourseDetailPageProps {
  course: CourseDetail
  curriculumUpgrade?: CurriculumUpgradeNotice
}

export function CourseDetailPage({
  course,
  curriculumUpgrade,
}: CourseDetailPageProps) {
  const isNotStarted = course.progress.completedLessons === 0
  const hasCurriculumUpgrade = curriculumUpgrade?.status === "available"

  return (
    <div className="w-full bg-background text-foreground">
      <div className="mx-auto flex max-w-[720px] flex-col px-5 pt-8 pb-20 sm:px-6 sm:pt-10 sm:pb-28">
        <section className="flex flex-col gap-8" aria-labelledby="course-title">
          <div className="relative aspect-video w-full overflow-hidden rounded-[20px] bg-muted">
            <Image
              src={course.thumbnail}
              alt={`${course.title} 썸네일`}
              fill
              sizes="(max-width: 767px) calc(100vw - 40px), 672px"
              className="object-cover"
              preload
            />
          </div>

          <header className="mb-10 flex flex-col gap-5 sm:mb-12">
            <div className="flex flex-col gap-3">
              <h1
                id="course-title"
                className="m-0 text-3xl/10 font-bold tracking-normal sm:text-4xl/11"
              >
                {course.title}
              </h1>
              <p className="m-0 max-w-[560px] text-base/7 text-muted-foreground sm:text-[17px]/8">
                {course.description}
              </p>
            </div>

            {hasCurriculumUpgrade ? (
              <CourseUpgradeNotice upgrade={curriculumUpgrade} />
            ) : null}

            <Card variant="filled" className="rounded-4xl">
              {!isNotStarted && (
                <>
                  <CardHeader className="gap-3">
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="text-sm font-medium text-muted-foreground">
                        전체 진행률
                      </span>
                      <span className="shrink-0 text-2xl font-bold text-primary">
                        {course.progress.percentage}%
                      </span>
                    </div>
                    <ProgressBar
                      value={course.progress.percentage}
                      aria-label={`${course.title} 전체 진행률`}
                      className="gap-0 [&_[data-slot=progress-indicator]]:bg-primary [&_[data-slot=progress-track]]:h-2 [&_[data-slot=progress-track]]:bg-muted"
                    />
                    <p className="m-0 text-sm font-medium text-muted-foreground">
                      {course.progress.completedLessons} /{" "}
                      {course.progress.totalLessons} 완료
                    </p>
                  </CardHeader>

                  <CardContent>
                    <Separator />
                  </CardContent>
                </>
              )}

              <CardFooter className="flex-col items-stretch gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="text-xs font-bold text-primary uppercase">
                    {isNotStarted ? "첫 레슨 시작" : "이어서 학습하기"}
                  </span>
                  <h2 className="m-0 text-base/6 font-semibold tracking-normal">
                    {course.nextLesson.title}
                  </h2>
                  <p className="m-0 text-sm/6 text-muted-foreground">
                    {course.nextLesson.description}
                  </p>
                </div>
                <Button
                  nativeButton={false}
                  render={
                    <Link
                      href={`/app/lesson?lesson_id=${course.nextLesson.lessonId}`}
                    />
                  }
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  <span>{isNotStarted ? "시작하기" : "이어하기"}</span>
                  <PlayIcon data-icon="inline-end" className="fill-current" />
                </Button>
              </CardFooter>
            </Card>
          </header>
        </section>

        <CourseCurriculum course={course} />
      </div>
    </div>
  )
}
