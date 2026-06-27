"use client"

import type { ReactNode, Ref } from "react"

import {
  getLessonStepExplanation,
  getLessonStepWrongText,
  type LessonStepCheckedState,
} from "@/features/lessons/lesson-step-policy"
import type { LessonStep } from "@/features/lessons/lesson-types"
import { XIcon } from "@workspace/ui/components/icons"
import { Button } from "@workspace/ui/components/ui/button"
import {
  CalloutContent,
  CalloutTitle,
} from "@workspace/ui/components/ui/callout"
import { Progress } from "@workspace/ui/components/ui/progress"
import { StickyActionBar } from "@workspace/ui/components/ui/sticky-action-bar"

type LessonCheckedState = false | LessonStepCheckedState

export function LessonShell({
  children,
  contentRef,
  footer,
  header,
}: {
  readonly children: ReactNode
  readonly contentRef?: Ref<HTMLElement>
  readonly footer: ReactNode
  readonly header: ReactNode
}) {
  return (
    <div className="flex h-dvh min-h-screen w-full flex-col overflow-hidden bg-bg-canvas text-fg-default">
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
    <header
      aria-label="레슨 진행"
      className="mx-auto flex w-full max-w-3xl shrink-0 items-center px-6 pb-4 pt-6"
    >
      <Button
        aria-label="나가기"
        className="mr-4"
        onClick={onExit}
        size="icon-sm"
        type="button"
        variant="ghost"
      >
        <XIcon size={28} />
      </Button>
      <Progress
        aria-label="레슨 진행률"
        className="flex-1"
        indicatorClassName="bg-progress-lesson-indicator"
        trackClassName="h-4 bg-bg-surface"
        value={progress}
      />
      <div className="ml-4 text-label-md font-bold text-fg-muted">
        {currentStepNumber}/{totalStepCount}
      </div>
    </header>
  )
}

export function LessonCheckedFooter({
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
    <StickyActionBar
      className="pointer-events-auto mx-auto max-w-2xl an-su"
      tone={feedback.isCorrect ? "success" : "danger"}
    >
      <div className="-mx-6 h-10 bg-gradient-to-t from-bg-canvas to-transparent" />
      <div
        className={
          feedback.isCorrect
            ? "-mx-6 h-1 bg-success-bg"
            : "-mx-6 h-1 bg-danger-bg"
        }
      />
      <div className="-mx-6 bg-bg-canvas px-6 pt-5 pb-2 grid gap-4">
        <div className="grid gap-2">
          <CalloutTitle className="text-[1.25rem] font-black">
            {feedback.title}
          </CalloutTitle>
          {feedback.body === "" ? null : (
            <CalloutContent>{feedback.body}</CalloutContent>
          )}
        </div>
        <Button
          className="w-full"
          onClick={onNext}
          size="lg"
          variant={feedback.isCorrect ? "correct" : "wrong"}
        >
          계속하기
        </Button>
      </div>
    </StickyActionBar>
  )
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
