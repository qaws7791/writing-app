"use client"

/* eslint-disable react/button-has-type */

import type { ReactNode } from "react"
import { useEffect, useMemo, useRef, useState } from "react"

import { useRouter } from "next/navigation"

import type {
  CourseDetail,
  CourseLessonSummary,
} from "@/features/courses/course-types"
import {
  getFirstLessonStep,
  getLessonStep,
  isLastLessonStep,
  type LessonStepAnswerPayload,
} from "@/features/lessons/lesson-logic"
import {
  getLessonStepActionLabel,
  getLessonStepCheckedResult,
  getLessonStepExplanation,
  getLessonStepWrongText,
  isLessonStepCheckable,
  isLessonStepSubmittable,
  type LessonStepCheckedState,
} from "@/features/lessons/lesson-step-policy"
import { LessonStepRenderer } from "@/features/lessons/lesson-step-renderer"
import { useLessonPersistence } from "@/features/lessons/use-lesson-persistence"
import type { Lesson, LessonStep } from "@/features/lessons/lesson-types"
import { getBrowserLearnerSessionToken } from "@/lib/auth/session-token"
import { getBrowserWritingAppApi } from "@/lib/api/get-browser-writing-app-api"
import type { WritingAppApi } from "@/lib/api/writing-app-api"
import { XIcon } from "@workspace/ui/components/icons"

type LessonExperienceProps = {
  readonly api?: WritingAppApi
  readonly courseDetail?: CourseDetail
  readonly lesson: Lesson
}

type LessonCheckedState = false | LessonStepCheckedState

export function LessonExperience({
  api,
  courseDetail,
  lesson,
}: LessonExperienceProps) {
  const router = useRouter()
  const contentRef = useRef<HTMLElement>(null)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [showExit, setShowExit] = useState(false)
  const [checked, setChecked] = useState<LessonCheckedState>(false)
  const [answerPayloads, setAnswerPayloads] = useState<
    Readonly<Record<string, LessonStepAnswerPayload>>
  >({})
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

  useEffect(() => {
    if (!hasStarted) {
      return
    }

    contentRef.current?.scrollTo?.({ top: 0 })
    scrollWindowToTop()
  }, [currentStepIndex, hasStarted])

  if (isComplete) {
    return (
      <LessonCompleteScreen
        courseDetail={courseDetail}
        lesson={lesson}
        onCourse={() => router.push(`/app/courses/${lesson.courseId}`)}
        onNext={(nextLessonId) =>
          router.push(
            `/app/lesson?lesson_id=${encodeURIComponent(nextLessonId)}`
          )
        }
      />
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
    const currentAnswerPayload = answerPayloads[currentStep.id]
    const isReady = isLessonStepSubmittable(currentStep, currentAnswerPayload)
    const isQuizStep = isLessonStepCheckable(currentStep)

    return (
      <LessonShell
        contentRef={contentRef}
        footer={
          checked === false ? (
            <div className="w-full max-w-2xl px-6 pb-8 pt-10 bg-gradient-to-t from-cream via-cream to-transparent">
              <LessonPrimaryButton
                disabled={!isReady || isCompleting}
                onClick={() => {
                  if (isQuizStep) {
                    setChecked(
                      getLessonStepCheckedResult(
                        currentStep,
                        currentAnswerPayload
                      )
                    )
                    return
                  }

                  void handleNextStep(isLastStep)
                }}
                variant={isReady ? "primary" : "secondary"}
              >
                {isCompleting
                  ? "완료 저장 중"
                  : getLessonStepActionLabel(currentStep)}
              </LessonPrimaryButton>
            </div>
          ) : (
            <LessonCheckedFooter
              checked={checked}
              onNext={() => void handleNextStep(isLastStep)}
              step={currentStep}
            />
          )
        }
        header={
          <LessonProgressHeader
            currentStepNumber={visibleStepNumber}
            onExit={() => setShowExit(true)}
            progress={progress}
            totalStepCount={lesson.steps.length}
          />
        }
      >
        <div className="an-fi">
          <LessonStepRenderer
            answerError={answerError}
            checked={checked}
            onAiFeedbackRequest={requestAiFeedback}
            onAnswerChange={saveAnswer}
            onAnswerPayloadChange={({ payload, stepId }) =>
              setAnswerPayloads((previous) => ({
                ...previous,
                [stepId]: payload,
              }))
            }
            key={currentStepIndex}
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
        {showExit ? (
          <LessonExitModal
            onCancel={() => setShowExit(false)}
            onConfirm={() => {
              setShowExit(false)
              router.push(`/app/courses/${lesson.courseId}`)
            }}
          />
        ) : null}
      </LessonShell>
    )
  }

  async function handleStart() {
    const isStarted = await startLesson()

    if (isStarted) {
      setCurrentStepIndex(0)
      setChecked(false)
      setHasStarted(true)
    }
  }

  async function handleNextStep(isLastStep: boolean) {
    setChecked(false)

    if (isLastStep) {
      await handleComplete()
      return
    }

    setCurrentStepIndex((index) => Math.min(lesson.steps.length - 1, index + 1))
  }

  async function handleComplete() {
    const completed = await completeLesson(currentStepIndex)

    if (completed) {
      setIsComplete(true)
    }
  }

  return (
    <LessonShell
      footer={
        <div className="w-full max-w-2xl px-6 pb-8 pt-10 bg-gradient-to-t from-cream via-cream to-transparent">
          <LessonPrimaryButton
            disabled={firstStep === null || isSavingStart}
            onClick={handleStart}
          >
            {isSavingStart ? "저장 중" : "시작하기"}
          </LessonPrimaryButton>
        </div>
      }
      header={
        <LessonProgressHeader
          currentStepNumber={0}
          onExit={() => router.push(`/app/courses/${lesson.courseId}`)}
          progress={0}
          totalStepCount={lesson.steps.length}
        />
      }
    >
      <div className="an-fi">
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
    </LessonShell>
  )
}

function LessonShell({
  children,
  contentRef,
  footer,
  header,
}: {
  readonly children: ReactNode
  readonly contentRef?: React.Ref<HTMLElement>
  readonly footer: ReactNode
  readonly header: ReactNode
}) {
  return (
    <div className="flex h-dvh min-h-screen w-full flex-col overflow-hidden bg-cream text-charcoal">
      {header}
      <main
        aria-label="레슨 콘텐츠"
        className="min-h-0 flex-1 overflow-y-auto"
        ref={contentRef}
      >
        <div className="w-full max-w-2xl mx-auto px-6 pt-6 md:pt-10 pb-8">
          {children}
        </div>
      </main>
      <footer
        aria-label="레슨 행동"
        className="shrink-0 w-full flex justify-center"
      >
        {footer}
      </footer>
    </div>
  )
}

function LessonProgressHeader({
  currentStepNumber,
  onExit,
  progress,
  totalStepCount,
}: {
  readonly currentStepNumber: number
  readonly onExit: () => void
  readonly progress: number
  readonly totalStepCount: number
}) {
  return (
    <header
      aria-label="레슨 진행"
      className="shrink-0 w-full max-w-3xl mx-auto flex items-center px-6 pt-6 pb-4"
    >
      <button
        aria-label="나가기"
        className="text-muted hover:text-charcoal font-bold mr-4 transition-colors w-9 h-9 flex items-center justify-center"
        onClick={onExit}
      >
        <XIcon size={28} />
      </button>
      <div
        aria-label="레슨 진행률"
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={Math.round(progress)}
        className="flex-1 bg-surface h-4 rounded-full overflow-hidden"
        role="progressbar"
      >
        <div
          className="bg-primary h-full rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div
        className="ml-4 font-bold text-muted"
        style={{ fontSize: "0.875rem" }}
      >
        {currentStepNumber}/{totalStepCount}
      </div>
    </header>
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
  readonly variant?: "correct" | "primary" | "secondary" | "wrong"
}) {
  const variantClassName = {
    correct: "bg-mint-light text-charcoal",
    primary: "bg-charcoal text-cream",
    secondary: "bg-surface text-charcoal",
    wrong: "bg-coral-light text-charcoal",
  }[variant]

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

function LessonCheckedFooter({
  checked,
  onNext,
  step,
}: {
  readonly checked: Exclude<LessonCheckedState, false>
  readonly onNext: () => void
  readonly step: LessonStep
}) {
  const feedback = getCheckedFeedback(step, checked)

  return (
    <div className="w-full max-w-2xl pointer-events-auto an-su">
      <div className="h-10 bg-gradient-to-t from-cream to-transparent" />
      <div
        className={cx(
          "h-1",
          feedback.isCorrect ? "bg-mint-light" : "bg-coral-light"
        )}
      />
      <div className="bg-cream px-6 pb-8 pt-5">
        <p
          className={cx(
            "font-black mb-2",
            feedback.isCorrect ? "text-mint-dark" : "text-coral-dark"
          )}
          style={{ fontSize: "1.25rem" }}
        >
          {feedback.title}
        </p>
        {feedback.body === "" ? null : (
          <p
            className="text-muted font-medium mb-5"
            style={{ fontSize: "1rem" }}
          >
            {feedback.body}
          </p>
        )}
        <LessonPrimaryButton
          onClick={onNext}
          variant={feedback.isCorrect ? "correct" : "wrong"}
        >
          계속하기
        </LessonPrimaryButton>
      </div>
    </div>
  )
}

function LessonCompleteScreen({
  courseDetail,
  lesson,
  onCourse,
  onNext,
}: {
  readonly courseDetail?: CourseDetail
  readonly lesson: Lesson
  readonly onCourse: () => void
  readonly onNext: (nextLessonId: string) => void
}) {
  const points = lesson.summary
  const nextLesson = getNextCourseLesson(courseDetail, lesson.id)
  const totalLessons = courseDetail?.progress.totalLessons ?? 1
  const completedLessons = Math.min(
    totalLessons,
    (courseDetail?.progress.completedLessons ?? 0) + 1
  )

  return (
    <div className="flex flex-col min-h-screen bg-primary w-full fixed inset-0 z-50 overflow-y-auto">
      <div className="w-full max-w-3xl mx-auto flex flex-col items-center text-center px-6 py-16 my-auto an-fi">
        <div className="mb-4" style={{ fontSize: "5rem" }}>
          🙌
        </div>
        <h1
          className="font-black mb-3 text-ink"
          style={{ fontSize: "2.75rem" }}
        >
          완료!
        </h1>
        <p
          className="text-ink font-bold mb-10"
          style={{ fontSize: "1.125rem" }}
        >
          오늘의 학습이 저장되었습니다.
        </p>
        {points.length > 0 ? (
          <div className="w-full bg-cream rounded-5xl p-7 mb-6 text-left">
            <p
              className="font-black text-muted mb-5"
              style={{ fontSize: "0.8125rem", letterSpacing: "0.06em" }}
            >
              이번 레슨 핵심 요약
            </p>
            <ul className="space-y-4">
              {points.map((point, index) => (
                <li className="flex items-start gap-4" key={point}>
                  <div
                    className="w-7 h-7 bg-primary rounded-full flex justify-center items-center font-black text-ink shrink-0"
                    style={{ fontSize: "0.875rem" }}
                  >
                    {index + 1}
                  </div>
                  <p
                    className="font-medium leading-relaxed"
                    style={{ fontSize: "1rem" }}
                  >
                    {point}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className="w-full bg-cream rounded-5xl p-7 mb-10 flex flex-row justify-around items-center text-center">
          <div className="flex flex-col items-center gap-1">
            <span
              className="font-bold text-muted"
              style={{ fontSize: "0.875rem" }}
            >
              완료한 레슨
            </span>
            <span
              className="font-black text-charcoal"
              style={{ fontSize: "2rem" }}
            >
              +1
            </span>
          </div>
          <div className="w-px h-12 bg-surface rounded-full" />
          <div className="flex flex-col items-center gap-1">
            <span
              className="font-bold text-muted"
              style={{ fontSize: "0.875rem" }}
            >
              코스 진행률
            </span>
            <span
              className="font-black text-charcoal"
              style={{ fontSize: "2rem" }}
            >
              {completedLessons}/{totalLessons}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-sm">
          {nextLesson === null ? null : (
            <LessonPrimaryButton onClick={() => onNext(nextLesson.id)}>
              다음 레슨 →
            </LessonPrimaryButton>
          )}
          <LessonPrimaryButton onClick={onCourse} variant="secondary">
            코스로 돌아가기
          </LessonPrimaryButton>
        </div>
      </div>
    </div>
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

function getNextCourseLesson(
  courseDetail: CourseDetail | undefined,
  lessonId: string
): CourseLessonSummary | null {
  if (courseDetail === undefined) {
    return null
  }

  const lessons = courseDetail.units
    .flatMap((unit) =>
      unit.lessons.map((unitLesson) => ({
        lesson: unitLesson,
        unitOrder: unit.order,
      }))
    )
    .sort(
      (left, right) =>
        left.unitOrder - right.unitOrder ||
        left.lesson.order - right.lesson.order
    )
  const lessonIndex = lessons.findIndex((item) => item.lesson.id === lessonId)

  if (lessonIndex < 0) {
    return null
  }

  return lessons[lessonIndex + 1]?.lesson ?? null
}

function getCheckedFeedback(
  step: LessonStep,
  checked: Exclude<LessonCheckedState, false>
): {
  readonly body: string
  readonly isCorrect: boolean
  readonly title: string
} {
  if (checked === "correct") {
    return {
      body: getLessonStepExplanation(step),
      isCorrect: true,
      title: "완벽해요!",
    }
  }

  if (checked === "wrong") {
    return {
      body:
        getLessonStepWrongText(step) ??
        getLessonStepExplanation(step) ??
        "다시 생각해보세요.",
      isCorrect: false,
      title: "아쉽지만 달라요",
    }
  }

  const isCorrect = checked.wrong.length === 0 && checked.missed.length === 0

  return {
    body: isCorrect
      ? (checked.explanation ?? "")
      : `잘못 선택: ${checked.wrong.length}개, 놓침: ${checked.missed.length}개`,
    isCorrect,
    title: isCorrect ? "정확해요!" : "다시 확인해보세요",
  }
}

function scrollWindowToTop() {
  if (navigator.userAgent.toLowerCase().includes("jsdom")) {
    return
  }

  window.scrollTo(0, 0)
}

function cx(...classes: Array<false | null | string | undefined>): string {
  return classes.filter(Boolean).join(" ")
}
