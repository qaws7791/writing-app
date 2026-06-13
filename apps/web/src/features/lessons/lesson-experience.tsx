"use client"

/* eslint-disable react/button-has-type */

import Link from "next/link"
import type { ReactNode } from "react"
import { useMemo, useState } from "react"

import { useRouter } from "next/navigation"

import {
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
import { buttonVariants } from "@workspace/ui/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/ui/card"
import {
  ArrowRightIcon,
  CheckCircleIcon,
  XIcon,
} from "@workspace/ui/components/icons"

type LessonExperienceProps = {
  readonly api?: WritingAppApi
  readonly lesson: Lesson
}

export function LessonExperience({ api, lesson }: LessonExperienceProps) {
  const router = useRouter()
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [showExit, setShowExit] = useState(false)
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
    const visibleStepNumber = Math.min(
      currentStepIndex + 1,
      lesson.steps.length
    )
    const progress = lesson.steps.length
      ? Math.min(
          100,
          Math.max(0, (visibleStepNumber / lesson.steps.length) * 100)
        )
      : 0

    return (
      <div className="flex flex-col min-h-screen bg-cream w-full fixed inset-0 z-50 overflow-y-auto">
        <div className="w-full max-w-3xl mx-auto flex items-center px-6 pt-6 pb-4">
          <button
            aria-label="나가기"
            className="text-muted hover:text-charcoal font-bold mr-4 transition-colors w-9 h-9 flex items-center justify-center"
            onClick={() => setShowExit(true)}
          >
            <XIcon size={28} />
          </button>
          <div className="flex-1 bg-surface h-4 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div
            className="ml-4 font-bold text-muted"
            style={{ fontSize: "0.875rem" }}
          >
            {visibleStepNumber}/{lesson.steps.length}
          </div>
        </div>
        <div className="flex-1 w-full max-w-2xl mx-auto px-6 pt-6 md:pt-10 pb-48 an-fi">
          <LessonStepRenderer
            answerError={answerError}
            onAiFeedbackRequest={requestAiFeedback}
            onAnswerChange={saveAnswer}
            step={currentStep}
            stepIndex={currentStepIndex}
            totalSteps={lesson.steps.length}
          />
          {completeError === null ? null : (
            <p className="mt-6 rounded-2xl bg-coral/10 px-4 py-3 text-coral-dark font-bold">
              {completeError}
            </p>
          )}
        </div>
        <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
          <div className="w-full max-w-2xl px-6 pb-8 pt-10 bg-gradient-to-t from-cream via-cream to-transparent pointer-events-auto">
            <LessonPrimaryButton
              disabled={isCompleting}
              onClick={() => {
                if (isLastStep) {
                  void handleComplete()
                  return
                }

                setCurrentStepIndex((index) =>
                  Math.min(lesson.steps.length - 1, index + 1)
                )
              }}
            >
              {isCompleting ? "완료 저장 중" : getStepActionLabel(currentStep)}
            </LessonPrimaryButton>
          </div>
        </div>
        {showExit ? (
          <LessonExitModal
            onCancel={() => setShowExit(false)}
            onConfirm={() => {
              setShowExit(false)
              router.push(`/app/courses/${lesson.courseId}`)
            }}
          />
        ) : null}
      </div>
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
    <div className="flex flex-col min-h-screen bg-cream w-full fixed inset-0 z-50 overflow-y-auto">
      <div className="w-full max-w-3xl mx-auto flex items-center px-6 pt-6 pb-4">
        <button
          aria-label="나가기"
          className="text-muted hover:text-charcoal font-bold mr-4 transition-colors w-9 h-9 flex items-center justify-center"
          onClick={() => router.push(`/app/courses/${lesson.courseId}`)}
        >
          <XIcon size={28} />
        </button>
      </div>
      <div className="flex-1 w-full max-w-2xl mx-auto px-6 pt-6 md:pt-10 pb-48 an-fi">
        {lesson.category === null ? null : (
          <div
            className="font-bold text-muted tracking-widest mb-4"
            style={{ fontSize: "0.8125rem" }}
          >
            {lesson.category}
          </div>
        )}
        <h1
          className="font-bold mb-6"
          style={{ fontSize: "2.5rem", lineHeight: 1.2 }}
        >
          {lesson.title}
        </h1>
        {lesson.description === null ? null : (
          <p
            className="text-muted font-medium mb-8"
            style={{ fontSize: "1.125rem" }}
          >
            {lesson.description}
          </p>
        )}
        <div
          className="flex gap-6 text-muted font-medium"
          style={{ fontSize: "0.9375rem" }}
        >
          <span>⏱ {lesson.estimatedMinutes}분</span>
          <span>📚 {lesson.steps.length}개 스텝</span>
        </div>
        {startError === null ? null : (
          <p className="mt-8 rounded-2xl bg-coral/10 px-4 py-3 text-coral-dark font-bold">
            {startError}
          </p>
        )}
      </div>
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
        <div className="w-full max-w-2xl px-6 pb-8 pt-10 bg-gradient-to-t from-cream via-cream to-transparent pointer-events-auto">
          <LessonPrimaryButton
            disabled={firstStep === null || isSavingStart}
            onClick={handleStart}
          >
            {isSavingStart ? "저장 중" : "시작하기"}
          </LessonPrimaryButton>
        </div>
      </div>
    </div>
  )
}

function LessonPrimaryButton({
  children,
  className,
  disabled,
  onClick,
  variant = "primary",
}: {
  readonly children: ReactNode
  readonly className?: string
  readonly disabled?: boolean
  readonly onClick: () => void
  readonly variant?: "primary" | "secondary"
}) {
  const variantClassName =
    variant === "secondary"
      ? "bg-surface text-charcoal"
      : "bg-charcoal text-cream"

  return (
    <button
      className={cx(
        "w-full font-bold py-5 rounded-4xl btn-squish",
        variantClassName,
        disabled ? "opacity-50 cursor-not-allowed" : undefined,
        className
      )}
      disabled={disabled}
      onClick={onClick}
      style={{ fontSize: "1.125rem" }}
      type="button"
    >
      {children}
    </button>
  )
}

function LessonExitModal({
  onCancel,
  onConfirm,
}: {
  readonly onCancel: () => void
  readonly onConfirm: () => void
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-charcoal/30 backdrop-blur-sm">
      <div className="bg-cream rounded-4xl p-8 w-full max-w-md an-fi">
        <h3 className="font-bold mb-3" style={{ fontSize: "1.5rem" }}>
          학습을 중단할까요?
        </h3>
        <p
          className="text-muted font-medium mb-8"
          style={{ fontSize: "1.125rem" }}
        >
          진행 상황은 자동으로 저장되어 있어요.
        </p>
        <div className="flex gap-3">
          <LessonPrimaryButton onClick={onCancel} variant="secondary">
            계속 학습
          </LessonPrimaryButton>
          <LessonPrimaryButton onClick={onConfirm}>나가기</LessonPrimaryButton>
        </div>
      </div>
    </div>
  )
}

function getStepActionLabel(step: Lesson["steps"][number]): string {
  if (step.type === "READING" || step.type === "COMPARE") {
    return "이해했어요"
  }

  if (
    step.type === "MULTIPLE_CHOICE" ||
    step.type === "FILL_BLANK" ||
    step.type === "SELECT" ||
    step.type === "ORDER" ||
    step.type === "MATCH"
  ) {
    return "확인하기"
  }

  return "다음으로 →"
}

function cx(...classes: Array<false | null | string | undefined>): string {
  return classes.filter(Boolean).join(" ")
}
