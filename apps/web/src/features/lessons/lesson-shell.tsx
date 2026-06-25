"use client"

import type { ReactNode, Ref } from "react"

import {
  getLessonStepExplanation,
  getLessonStepWrongText,
  type LessonStepCheckedState,
} from "@/features/lessons/lesson-step-policy"
import type { LessonStep } from "@/features/lessons/lesson-types"
import { XIcon } from "@workspace/ui/components/icons"
import { Progress } from "@workspace/ui/components/ui/progress"

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
      className="shrink-0 w-full max-w-3xl mx-auto flex items-center px-6 pt-6 pb-4"
    >
      <button
        aria-label="나가기"
        className="text-muted hover:text-charcoal font-bold mr-4 transition-colors w-9 h-9 flex items-center justify-center"
        onClick={onExit}
        type="button"
      >
        <XIcon size={28} />
      </button>
      <Progress aria-label="레슨 진행률" className="flex-1" value={progress} />
      <div className="ml-4 text-label-md font-bold text-muted">
        {currentStepNumber}/{totalStepCount}
      </div>
    </header>
  )
}

export function LessonPrimaryButton({
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

function cx(...classes: Array<false | null | string | undefined>): string {
  return classes.filter(Boolean).join(" ")
}
