"use client"

import type { ReactNode, Ref } from "react"

import {
  isLessonStepCheckedCorrect,
  type LessonStepCheckedState,
} from "@/features/lesson-session/model/lesson-step-policy"
import { Button } from "@workspace/ui/components/ui/button"
import {
  Insight,
  InsightDescription,
  InsightTitle,
} from "@workspace/ui/components/ui/insight"
import {
  Lesson,
  LessonActions,
  LessonClose,
  LessonFooter,
  LessonHeader,
  LessonMeta,
  LessonProgress,
} from "@workspace/ui/components/ui/lesson"
import { cn } from "@workspace/ui/lib/utils"

type LessonCheckedState = false | LessonStepCheckedState

export function LessonShell({
  children,
  contentLabelledBy,
  contentRef,
  fixedFooter = false,
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
    <div
      className={cn(
        "h-dvh min-h-screen w-full overflow-hidden bg-background text-foreground",
        fixedFooter && "fixed inset-0 z-50"
      )}
    >
      <Lesson className="h-full px-4 sm:px-6">
        {header}
        <main
          aria-label={
            contentLabelledBy === undefined ? "레슨 콘텐츠" : undefined
          }
          aria-labelledby={contentLabelledBy}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
          ref={contentRef}
        >
          <div className="flex min-h-full flex-col py-2 pb-8 sm:py-4 sm:pb-10">
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
  onNext,
}: {
  readonly checked: Exclude<LessonCheckedState, false>
  readonly onNext: () => void
}) {
  const feedback = getCheckedFeedback(checked)

  return (
    <LessonFooter aria-label="레슨 행동">
      <div className="flex flex-col gap-3">
        <Insight tone={feedback.isCorrect ? "correct" : "incorrect"}>
          <InsightTitle>{feedback.title}</InsightTitle>
          {feedback.body === "" ? null : (
            <InsightDescription>{feedback.body}</InsightDescription>
          )}
        </Insight>
        <LessonActions>
          <Button onClick={onNext} size="lg">
            계속하기
          </Button>
        </LessonActions>
      </div>
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
