"use client"

import type { Ref } from "react"

import type {
  CourseDetail,
  CourseLessonSummary,
} from "@/features/courses/course-types"
import type {
  LessonAiFeedbackOutcome,
  LessonAiFeedbackRequest,
  LessonAnswerChange,
  LessonStepAnswerPayload,
} from "@/features/lessons/lesson-logic"
import type { LessonStepCheckedState } from "@/features/lessons/lesson-step-policy"
import { getLessonStepActionLabel } from "@/features/lessons/lesson-step-policy"
import { LessonStepRenderer } from "@/features/lessons/lesson-step-renderer"
import type { Lesson, LessonStep } from "@/features/lessons/lesson-types"
import {
  LessonCheckedFooter,
  LessonPrimaryButton,
  LessonProgressHeader,
  LessonShell,
} from "@/features/lessons/lesson-shell"

type LessonCheckedState = false | LessonStepCheckedState

export function LessonStartScreen({
  canStart,
  isSavingStart,
  lesson,
  onExit,
  onStart,
  startError,
}: {
  readonly canStart: boolean
  readonly isSavingStart: boolean
  readonly lesson: Lesson
  readonly onExit: () => void
  readonly onStart: () => void
  readonly startError: null | string
}) {
  return (
    <LessonShell
      footer={
        <div className="w-full max-w-2xl px-6 pb-8 pt-10 bg-gradient-to-t from-cream via-cream to-transparent">
          <LessonPrimaryButton
            disabled={!canStart || isSavingStart}
            onClick={onStart}
          >
            {isSavingStart ? "저장 중" : "시작하기"}
          </LessonPrimaryButton>
        </div>
      }
      header={
        <LessonProgressHeader
          currentStepNumber={0}
          onExit={onExit}
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

export function LessonActiveScreen({
  answerError,
  checked,
  completeError,
  contentRef,
  currentStep,
  currentStepIndex,
  isCompleting,
  isReady,
  lesson,
  onAiFeedbackRequest,
  onAnswerChange,
  onAnswerPayloadChange,
  onCancelExit,
  onConfirmExit,
  onExit,
  onSubmitCurrentStep,
  progress,
  showExit,
  visibleStepNumber,
}: {
  readonly answerError: null | string
  readonly checked: LessonCheckedState
  readonly completeError: null | string
  readonly contentRef: Ref<HTMLElement>
  readonly currentStep: LessonStep
  readonly currentStepIndex: number
  readonly isCompleting: boolean
  readonly isReady: boolean
  readonly lesson: Lesson
  readonly onAiFeedbackRequest: (
    request: LessonAiFeedbackRequest
  ) => Promise<LessonAiFeedbackOutcome>
  readonly onAnswerChange: (change: LessonAnswerChange) => Promise<void>
  readonly onAnswerPayloadChange: (change: {
    readonly payload: LessonStepAnswerPayload
    readonly stepId: string
  }) => void
  readonly onCancelExit: () => void
  readonly onConfirmExit: () => void
  readonly onExit: () => void
  readonly onSubmitCurrentStep: () => void
  readonly progress: number
  readonly showExit: boolean
  readonly visibleStepNumber: number
}) {
  return (
    <LessonShell
      contentRef={contentRef}
      footer={
        checked === false ? (
          <div className="w-full max-w-2xl px-6 pb-8 pt-10 bg-gradient-to-t from-cream via-cream to-transparent">
            <LessonPrimaryButton
              disabled={!isReady || isCompleting}
              onClick={onSubmitCurrentStep}
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
            onNext={onSubmitCurrentStep}
            step={currentStep}
          />
        )
      }
      header={
        <LessonProgressHeader
          currentStepNumber={visibleStepNumber}
          onExit={onExit}
          progress={progress}
          totalStepCount={lesson.steps.length}
        />
      }
    >
      <div className="an-fi">
        <LessonStepRenderer
          answerError={answerError}
          checked={checked}
          onAiFeedbackRequest={onAiFeedbackRequest}
          onAnswerChange={onAnswerChange}
          onAnswerPayloadChange={onAnswerPayloadChange}
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
        <LessonExitModal onCancel={onCancelExit} onConfirm={onConfirmExit} />
      ) : null}
    </LessonShell>
  )
}

export function LessonCompleteScreen({
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
