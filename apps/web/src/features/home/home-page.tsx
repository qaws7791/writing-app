import Link from "next/link"

import type { ProgressCourseList } from "@/features/courses/course-types"
import { buttonVariants } from "@workspace/ui/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/ui/card"
import { Progress } from "@workspace/ui/components/ui/progress"
import {
  ArrowRightIcon,
  BookOpenIcon,
  FlameIcon,
} from "@workspace/ui/components/icons"

type HomePageProps = {
  readonly learnerName: null | string | undefined
  readonly notice?: string
  readonly progress: ProgressCourseList
}

export function HomePage({ learnerName, notice, progress }: HomePageProps) {
  const displayName = normalizeDisplayName(learnerName)
  const hasProgress = progress.courses.length > 0
  const nextLessonCount = progress.courses.reduce(
    (total, course) => total + course.nextLessons.slice(0, 2).length,
    0
  )

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 sm:px-8 lg:px-10">
        <section className="flex flex-col gap-4">
          <p className="text-sm font-medium text-primary">오늘의 학습</p>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-semibold">
                안녕하세요, {displayName}님
              </h1>
              <p className="max-w-2xl leading-7 text-muted-foreground">
                이어서 쓰고, 막히는 문장은 AI 코칭으로 다시 다듬어 보세요.
              </p>
            </div>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/app/courses"
            >
              배우기
              <ArrowRightIcon data-icon="inline-end" />
            </Link>
          </div>
        </section>

        {notice === undefined ? null : (
          <p className="rounded-lg border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
            {notice}
          </p>
        )}

        <section
          aria-labelledby="learning-context-heading"
          className="grid gap-4 md:grid-cols-3"
        >
          <h2 className="sr-only" id="learning-context-heading">
            전체 학습 맥락
          </h2>
          <Card>
            <CardHeader>
              <CardTitle as="h3" className="flex items-center gap-2">
                <FlameIcon className="text-primary" />
                {progress.currentStreakDays}일 연속 학습
              </CardTitle>
              <CardDescription>
                오늘 한 스텝만 완료해도 루틴이 이어집니다.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle as="h3">{progress.courses.length}개 코스</CardTitle>
              <CardDescription>
                현재 이어서 볼 수 있는 코스입니다.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle as="h3">{nextLessonCount}개 다음 레슨</CardTitle>
              <CardDescription>
                코스별로 최대 2개까지 바로 이어갈 수 있습니다.
              </CardDescription>
            </CardHeader>
          </Card>
        </section>

        <section aria-labelledby="progress-courses-heading">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h2
                className="text-2xl font-semibold"
                id="progress-courses-heading"
              >
                진행 중인 코스
              </h2>
              <p className="text-sm text-muted-foreground">
                완료한 레슨과 다음 레슨을 한눈에 확인합니다.
              </p>
            </div>
          </div>

          {hasProgress ? (
            <div className="grid gap-5 lg:grid-cols-2">
              {progress.courses.map((course) => (
                <Card
                  aria-labelledby={`home-course-${course.id}`}
                  key={course.id}
                  role="article"
                >
                  <CardHeader>
                    <CardTitle as="h3" id={`home-course-${course.id}`}>
                      {course.title}
                    </CardTitle>
                    <CardDescription>
                      {course.progressPercent}% 완료
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-5">
                    <Progress
                      aria-label={`${course.title} 진행률`}
                      value={course.progressPercent}
                    />
                    <div className="flex flex-col gap-3">
                      <p className="text-sm font-medium">다음 레슨</p>
                      <div className="flex flex-col gap-2">
                        {course.nextLessons.slice(0, 2).map((lesson) => (
                          <Link
                            aria-label={`${lesson.title} 이어하기`}
                            className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm transition-colors hover:bg-muted"
                            href={`/app/lesson?lesson_id=${lesson.id}`}
                            key={lesson.id}
                          >
                            <span className="flex items-center gap-2">
                              <BookOpenIcon className="text-primary" />
                              <span>{lesson.title}</span>
                            </span>
                            <span className="text-muted-foreground">
                              {lesson.estimatedMinutes}분
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle as="h3">아직 진행 중인 코스가 없습니다.</CardTitle>
                <CardDescription>
                  글쓰기 첫걸음 코스부터 시작하면 다음 레슨과 진행률이 이곳에
                  표시됩니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link
                  className={buttonVariants({ variant: "default" })}
                  href="/app/courses"
                >
                  코스 둘러보기
                  <ArrowRightIcon data-icon="inline-end" />
                </Link>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </main>
  )
}

function normalizeDisplayName(name: null | string | undefined): string {
  const trimmed = name?.trim()

  if (trimmed === undefined || trimmed.length === 0) {
    return "학습자"
  }

  return trimmed
}
