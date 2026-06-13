import Link from "next/link"

import type {
  CourseSummary,
  ProgressCourseList,
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

type CoursesPageProps = {
  readonly courses: readonly CourseSummary[]
  readonly progress: ProgressCourseList
}

export function CoursesPage({ courses, progress }: CoursesPageProps) {
  const groupedCourses = groupCoursesByCategory(courses)

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10 sm:px-8 lg:px-10">
        <section className="flex flex-col gap-2">
          <p className="text-sm font-medium text-primary">배우기</p>
          <h1 className="text-3xl font-semibold">코스</h1>
          <p className="max-w-2xl leading-7 text-muted-foreground">
            Kwep의 글쓰기 코스를 카테고리별로 살펴보고, 이어갈 코스를
            선택하세요.
          </p>
        </section>

        {groupedCourses.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle as="h2">표시할 코스가 없습니다.</CardTitle>
              <CardDescription>
                콘텐츠가 준비되면 이곳에 코스가 표시됩니다.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          groupedCourses.map((group, index) => {
            const categoryHeadingId = `course-category-${index}`

            return (
              <section
                aria-labelledby={categoryHeadingId}
                className="flex flex-col gap-4"
                key={group.category}
              >
                <div className="flex items-end justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <h2
                      className="text-2xl font-semibold"
                      id={categoryHeadingId}
                    >
                      {group.category}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {group.courses.length}개 코스
                    </p>
                  </div>
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  {group.courses.map((course) => {
                    const progressPercent = findCourseProgressPercent(
                      progress,
                      course.id
                    )

                    return (
                      <Card
                        aria-labelledby={`course-card-${course.id}`}
                        key={course.id}
                        role="article"
                      >
                        <CardHeader>
                          <CardTitle as="h3" id={`course-card-${course.id}`}>
                            {course.title}
                          </CardTitle>
                          <CardDescription>
                            {course.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-5">
                          <div className="flex items-center justify-between gap-4 text-sm">
                            <span>{course.lessonCount}개 레슨</span>
                            <span className="text-muted-foreground">
                              {progressPercent}% 진행
                            </span>
                          </div>
                          <Progress
                            aria-label={`${course.title} 진행률`}
                            value={progressPercent}
                          />
                          <Link
                            aria-label={`${course.title} 자세히 보기`}
                            className={buttonVariants({
                              className: "w-full",
                              variant: "outline",
                            })}
                            href={`/app/courses/${course.id}`}
                          >
                            자세히 보기
                            <ArrowRightIcon data-icon="inline-end" />
                          </Link>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </section>
            )
          })
        )}
      </div>
    </main>
  )
}

function groupCoursesByCategory(courses: readonly CourseSummary[]) {
  const groups: {
    readonly category: string
    readonly courses: CourseSummary[]
  }[] = []

  for (const course of courses) {
    const existingGroup = groups.find(
      (group) => group.category === course.category
    )

    if (existingGroup === undefined) {
      groups.push({
        category: course.category,
        courses: [course],
      })
      continue
    }

    existingGroup.courses.push(course)
  }

  return groups
}

function findCourseProgressPercent(
  progress: ProgressCourseList,
  courseId: string
): number {
  return (
    progress.courses.find((course) => course.id === courseId)
      ?.progressPercent ?? 0
  )
}
