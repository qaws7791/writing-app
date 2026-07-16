"use client"

import type { ReactNode, Ref } from "react"

import {
  isLessonStepCheckedCorrect,
  type LessonStepCheckedState,
} from "@/features/lessons/lesson-step-policy"
import { XIcon } from "@workspace/ui/components/icons"
import { Button } from "@workspace/ui/components/ui/button"
import {
  CalloutContent,
  CalloutTitle,
} from "@workspace/ui/components/ui/callout"
import { Progress } from "@workspace/ui/components/ui/progress"
import { StickyActionBar } from "@workspace/ui/components/ui/sticky-action-bar"
import { cn } from "@workspace/ui/lib/utils"

type LessonCheckedState = false | LessonStepCheckedState

export function LessonShell({
  children,
  contentRef,
  fixedFooter = false,
  footer,
  header,
}: {
  readonly children: ReactNode
  readonly contentRef?: Ref<HTMLElement>
  readonly fixedFooter?: boolean
  readonly footer: ReactNode
  readonly header: ReactNode
}) {
  return (
    <div
      className={cn(
        "flex h-dvh min-h-screen w-full flex-col overflow-hidden bg-background text-foreground",
        fixedFooter && "fixed inset-0 z-50"
      )}
    >
      {header}
      <main
        aria-label="레슨 콘텐츠"
        className="min-h-0 flex-1 overflow-y-auto"
        ref={contentRef}
      >
        <div
          className={cn(
            "w-full max-w-2xl mx-auto px-6 pt-6 md:pt-10",
            fixedFooter ? "pb-48" : "pb-8"
          )}
        >
          {children}
        </div>
      </main>
      <footer
        aria-label="레슨 행동"
        className={cn(
          "w-full flex justify-center",
          fixedFooter
            ? "pointer-events-none fixed inset-x-0 bottom-0 z-50"
            : "shrink-0"
        )}
      >
        {footer}
      </footer>
    </div>
  )
}

export function LessonIntroHeader({ onExit }: { readonly onExit: () => void }) {
  return (
    <header className="mx-auto flex w-full max-w-3xl shrink-0 items-center px-6 pb-4 pt-6">
      <Button
        aria-label="나가기"
        className="mr-4 text-muted-foreground hover:text-foreground"
        onClick={onExit}
        size="icon-sm"
        type="button"
        variant="ghost"
      >
        <XIcon size={28} />
      </Button>
    </header>
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
      <Progress aria-label="레슨 진행률" className="flex-1" value={progress} />
      <div className="ml-4 text-label-md font-bold text-muted-foreground">
        {currentStepNumber}/{totalStepCount}
      </div>
    </header>
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
    <StickyActionBar
      className="pointer-events-auto mx-auto max-w-2xl an-su"
      tone={feedback.isCorrect ? "success" : "danger"}
    >
      <div className="-mx-6 h-10 bg-gradient-to-t from-background to-transparent" />
      <div
        className={
          feedback.isCorrect ? "-mx-6 h-1 bg-success" : "-mx-6 h-1 bg-danger"
        }
      />
      <div className="-mx-6 bg-background px-6 pt-5 pb-2 grid gap-4">
        <div className="grid gap-2">
          <CalloutTitle className="text-heading-sm font-black">
            {feedback.title}
          </CalloutTitle>
          {feedback.body === "" ? null : (
            <CalloutContent>{feedback.body}</CalloutContent>
          )}
        </div>
        <Button
          className="w-full"
          onClick={onNext}
          size="extra"
          variant={feedback.isCorrect ? "correct" : "wrong"}
        >
          계속하기
        </Button>
      </div>
    </StickyActionBar>
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
