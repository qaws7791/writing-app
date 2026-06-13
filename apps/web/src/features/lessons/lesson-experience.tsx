"use client"

import { useMemo, useState } from "react"

import {
  formatEstimatedMinutes,
  formatStepCount,
  getFirstLessonStep,
} from "@/features/lessons/lesson-logic"
import { LessonStepRenderer } from "@/features/lessons/lesson-step-renderer"
import { useLessonPersistence } from "@/features/lessons/use-lesson-persistence"
import type { Lesson } from "@/features/lessons/lesson-types"
import { getBrowserWritingAppApi } from "@/lib/api/get-browser-writing-app-api"
import type { WritingAppApi } from "@/lib/api/writing-app-api"
import { Button } from "@workspace/ui/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/ui/card"
import { ArrowRightIcon } from "@workspace/ui/components/icons"

type LessonExperienceProps = {
  readonly api?: WritingAppApi
  readonly lesson: Lesson
}

export function LessonExperience({ api, lesson }: LessonExperienceProps) {
  const [hasStarted, setHasStarted] = useState(false)
  const resolvedApi = useMemo(
    () =>
      api ??
      getBrowserWritingAppApi({
        tokenProvider: () => null,
      }),
    [api]
  )
  const firstStep = getFirstLessonStep(lesson)
  const {
    answerError,
    isSavingStart,
    requestAiFeedback,
    saveAnswer,
    startError,
    startLesson,
  } = useLessonPersistence({
    api: resolvedApi,
    lesson,
  })

  if (hasStarted && firstStep !== null) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10 sm:px-8">
          <LessonStepRenderer
            answerError={answerError}
            onAiFeedbackRequest={requestAiFeedback}
            onAnswerChange={saveAnswer}
            step={firstStep}
            stepIndex={0}
            totalSteps={lesson.steps.length}
          />
        </div>
      </main>
    )
  }

  async function handleStart() {
    const isStarted = await startLesson()

    if (isStarted) {
      setHasStarted(true)
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10 sm:px-8">
        <section aria-labelledby="lesson-start-heading">
          <Card>
            <CardHeader>
              <p className="text-sm font-medium text-primary">
                {lesson.category ?? "레슨"}
              </p>
              <CardTitle as="h1" id="lesson-start-heading">
                {lesson.title}
              </CardTitle>
              <CardDescription>
                {lesson.description ?? "바로 시작할 수 있는 학습 레슨입니다."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <p className="rounded-lg border border-border px-4 py-3 text-sm">
                  {formatEstimatedMinutes(lesson.estimatedMinutes)}
                </p>
                <p className="rounded-lg border border-border px-4 py-3 text-sm">
                  {formatStepCount(lesson.steps.length)}
                </p>
              </div>
              {lesson.summary.length > 0 ? (
                <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
                  {lesson.summary.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
              {startError === null ? null : (
                <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {startError}
                </p>
              )}
            </CardContent>
            <CardFooter>
              <Button
                disabled={firstStep === null || isSavingStart}
                onClick={handleStart}
              >
                {isSavingStart ? "저장 중" : "시작하기"}
                <ArrowRightIcon data-icon="inline-end" />
              </Button>
            </CardFooter>
          </Card>
        </section>
      </div>
    </main>
  )
}
