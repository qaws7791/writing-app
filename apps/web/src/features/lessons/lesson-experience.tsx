"use client"

import Link from "next/link"
import { useMemo, useState } from "react"

import {
  formatEstimatedMinutes,
  formatStepCount,
  getFirstLessonStep,
  getLessonStep,
  isLastLessonStep,
} from "@/features/lessons/lesson-logic"
import { LessonStepRenderer } from "@/features/lessons/lesson-step-renderer"
import { useLessonPersistence } from "@/features/lessons/use-lesson-persistence"
import type { Lesson } from "@/features/lessons/lesson-types"
import { getBrowserLearnerSessionToken } from "@/lib/auth/session-token"
import { getBrowserWritingAppApi } from "@/lib/api/get-browser-writing-app-api"
import type { WritingAppApi } from "@/lib/api/writing-app-api"
import { Button, buttonVariants } from "@workspace/ui/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/ui/card"
import { ArrowRightIcon, CheckCircleIcon } from "@workspace/ui/components/icons"

type LessonExperienceProps = {
  readonly api?: WritingAppApi
  readonly lesson: Lesson
}

export function LessonExperience({ api, lesson }: LessonExperienceProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const resolvedApi = useMemo(
    () =>
      api ??
      getBrowserWritingAppApi({
        tokenProvider: getBrowserLearnerSessionToken,
      }),
    [api]
  )
  const firstStep = getFirstLessonStep(lesson)
  const {
    answerError,
    completeError,
    completeLesson,
    isCompleting,
    isSavingStart,
    requestAiFeedback,
    saveAnswer,
    startError,
    startLesson,
  } = useLessonPersistence({
    api: resolvedApi,
    lesson,
  })
  const currentStep = getLessonStep(lesson, currentStepIndex)

  if (isComplete) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10 sm:px-8">
          <Card>
            <CardHeader>
              <CheckCircleIcon className="text-primary" />
              <CardTitle as="h1">레슨을 완료했습니다.</CardTitle>
              <CardDescription>
                코스 상세에서 다음 레슨을 이어갈 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                className={buttonVariants()}
                href={`/app/courses/${lesson.courseId}`}
              >
                다음 레슨 보기
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  if (hasStarted && currentStep !== null) {
    const isLastStep = isLastLessonStep(lesson, currentStepIndex)

    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10 sm:px-8">
          <LessonStepRenderer
            answerError={answerError}
            onAiFeedbackRequest={requestAiFeedback}
            onAnswerChange={saveAnswer}
            step={currentStep}
            stepIndex={currentStepIndex}
            totalSteps={lesson.steps.length}
          />
          {completeError === null ? null : (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {completeError}
            </p>
          )}
          <div className="flex items-center justify-between gap-3">
            <Button
              disabled={currentStepIndex === 0}
              onClick={() =>
                setCurrentStepIndex((index) => Math.max(0, index - 1))
              }
              variant="outline"
            >
              이전
            </Button>
            {isLastStep ? (
              <Button disabled={isCompleting} onClick={handleComplete}>
                {isCompleting ? "완료 저장 중" : "완료하기"}
              </Button>
            ) : (
              <Button
                onClick={() =>
                  setCurrentStepIndex((index) =>
                    Math.min(lesson.steps.length - 1, index + 1)
                  )
                }
              >
                다음
                <ArrowRightIcon data-icon="inline-end" />
              </Button>
            )}
          </div>
        </div>
      </main>
    )
  }

  async function handleStart() {
    const isStarted = await startLesson()

    if (isStarted) {
      setCurrentStepIndex(0)
      setHasStarted(true)
    }
  }

  async function handleComplete() {
    const completed = await completeLesson(currentStepIndex)

    if (completed) {
      setIsComplete(true)
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
