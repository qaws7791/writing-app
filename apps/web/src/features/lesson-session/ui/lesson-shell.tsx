"use client"

import type { ReactNode, Ref } from "react"

import {
  isLessonStepCheckedCorrect,
  type LessonStepCheckedState,
} from "@/features/lesson-session/model/lesson-step-policy"
import {
  Lesson,
  LessonFeedback,
  LessonFeedbackActions,
  LessonFeedbackBody,
  LessonFeedbackContinueButton,
  LessonFeedbackDescription,
  LessonFeedbackRetryButton,
  LessonFeedbackTitle,
  LessonClose,
  LessonFooter,
  LessonHeader,
  LessonMeta,
  LessonProgress,
} from "@workspace/ui/components/learning/lesson"

type LessonCheckedState = false | LessonStepCheckedState

export function LessonShell({
  children,
  contentLabelledBy,
  contentRef,
  footer,
  header,
}: {
  readonly children: ReactNode
  readonly contentLabelledBy?: string
  readonly contentRef?: Ref<HTMLElement>
  readonly fixedFooter?: boolean
  readonly footer: ReactNode
  readonly header: ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 h-dvh w-full min-w-0 overflow-hidden bg-background text-foreground">
      <Lesson className="h-full">
        {header}
        <main
          aria-label={
            contentLabelledBy === undefined ? "레슨 콘텐츠" : undefined
          }
          aria-labelledby={contentLabelledBy}
          className="mx-auto min-h-0 w-full min-w-0 max-w-2xl flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6"
          ref={contentRef}
        >
          <div className="flex min-h-full flex-col pt-2 pb-8 sm:pt-4 sm:pb-10">
            {children}
          </div>
        </main>
        {footer}
      </Lesson>
    </div>
  )
}

export function LessonIntroHeader({ onExit }: { readonly onExit: () => void }) {
  return (
    <LessonHeader className="shrink-0 pt-4 sm:pt-6">
      <LessonClose aria-label="나가기" onClick={onExit} />
    </LessonHeader>
  )
}

export function LessonProgressHeader({
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
    <LessonHeader aria-label="레슨 진행" className="shrink-0 pt-4 sm:pt-6">
      <LessonClose aria-label="나가기" onClick={onExit} />
      <LessonProgress label="레슨 진행률" value={progress} />
      <LessonMeta>
        {currentStepNumber}/{totalStepCount}
      </LessonMeta>
    </LessonHeader>
  )
}

export function LessonCheckedFooter({
  checked,
  isSubmitting,
  onContinue,
  onRetry,
}: {
  readonly checked: Exclude<LessonCheckedState, false>
  readonly isSubmitting: boolean
  readonly onContinue: () => void
  readonly onRetry: () => void
}) {
  const feedback = getCheckedFeedback(checked)
  const tone = feedback.isCorrect ? "correct" : "incorrect"

  return (
    <LessonFooter
      aria-label="레슨 행동"
      className="bg-transparent pt-0 pb-0 backdrop-blur-none"
    >
      <LessonFeedback tone={tone}>
        <LessonFeedbackBody>
          <div className="flex flex-col gap-1.5">
            <LessonFeedbackTitle>{feedback.title}</LessonFeedbackTitle>
            {feedback.body === "" ? null : (
              <LessonFeedbackDescription>
                {feedback.body}
              </LessonFeedbackDescription>
            )}
          </div>
          {feedback.isCorrect ? (
            <LessonFeedbackContinueButton
              disabled={isSubmitting}
              onClick={onContinue}
              tone="correct"
            >
              {isSubmitting ? "계속하는 중…" : "계속하기"}
            </LessonFeedbackContinueButton>
          ) : (
            <LessonFeedbackActions>
              <LessonFeedbackRetryButton
                disabled={isSubmitting}
                onClick={onRetry}
              />
              <LessonFeedbackContinueButton
                disabled={isSubmitting}
                onClick={onContinue}
                tone="incorrect"
              >
                {isSubmitting ? "계속하는 중…" : "계속하기"}
              </LessonFeedbackContinueButton>
            </LessonFeedbackActions>
          )}
        </LessonFeedbackBody>
      </LessonFeedback>
    </LessonFooter>
  )
}

function getCheckedFeedback(checked: Exclude<LessonCheckedState, false>): {
  readonly body: string
  readonly isCorrect: boolean
  readonly title: string
} {
  const isCorrect = isLessonStepCheckedCorrect(checked)
  const explanation = "explanation" in checked ? checked.explanation : ""
  const wrongCount =
    "items" in checked
      ? checked.items.filter((item) => item.verdict === "incorrect").length
      : 0
  const missedCount =
    "items" in checked
      ? checked.items.filter((item) => item.verdict === "missed").length
      : 0

  return {
    body: isCorrect
      ? explanation
      : explanation ||
        (wrongCount + missedCount > 0
          ? `잘못 선택: ${wrongCount}개, 놓침: ${missedCount}개`
          : "다시 생각해보세요."),
    isCorrect,
    title: isCorrect ? "완벽해요!" : "다시 확인해보세요",
  }
}
