"use client"

import { useState } from "react"
import { RotateCcw } from "lucide-react"

import { lessonStepDefinitions } from "@workspace/contracts/content/steps"
import { Button } from "@workspace/ui/components/ui/button"
import { PageHeader } from "@workspace/ui/components/ui/page-header"
import { cn } from "@workspace/ui/lib/utils"

import type {
  LessonAiFeedbackOutcome,
  LessonAiFeedbackRequest,
  LessonStepAnswerPayload,
} from "@/features/step-debug/step-logic"
import {
  getLessonStepActionLabel,
  getLessonStepCheckedResult,
  getLessonStepExplanation,
  getLessonStepWrongText,
  isLessonStepCheckable,
  isLessonStepSubmittable,
  type LessonStepCheckedState,
} from "@/features/step-debug/step-policy"
import { LessonStepRenderer } from "@/features/step-debug/step-renderer"
import { StepDebugPanel } from "@/features/step-debug/step-debug-panel"
import { STEP_DEBUG_ENTRIES } from "@/features/step-debug/step-debug-samples"
import { StepDebugValidation } from "@/features/step-debug/step-debug-validation"

export function StepDebugPage() {
  const [selectedType, setSelectedType] = useState(
    STEP_DEBUG_ENTRIES[0]?.type ?? "READING"
  )

  const [prevSelectedType, setPrevSelectedType] = useState(selectedType)
  const [payload, setPayload] = useState<LessonStepAnswerPayload | undefined>(
    undefined
  )
  const [checked, setChecked] = useState<false | LessonStepCheckedState>(false)
  const [previewRevision, setPreviewRevision] = useState(0)

  if (selectedType !== prevSelectedType) {
    setPrevSelectedType(selectedType)
    setPayload(undefined)
    setChecked(false)
    setPreviewRevision(0)
  }

  const selectedEntry =
    STEP_DEBUG_ENTRIES.find((entry) => entry.type === selectedType) ??
    STEP_DEBUG_ENTRIES[0]

  if (selectedEntry === undefined) {
    return null
  }

  const step = selectedEntry.sample
  const isReady = isLessonStepSubmittable(step, payload)
  const isCheckable = isLessonStepCheckable(step)
  const actionLabel = getLessonStepActionLabel(step)
  const hideOuterActionBar = step.type === "AI_FEEDBACK" && checked === false

  const handleSubmit = () => {
    if (checked !== false) {
      return
    }

    if (isCheckable) {
      setChecked(getLessonStepCheckedResult(step, payload))
    }
  }

  const handleReset = () => {
    setPayload(undefined)
    setChecked(false)
    setPreviewRevision((revision) => revision + 1)
  }

  const handleAiFeedbackRequest = async (
    _request: LessonAiFeedbackRequest
  ): Promise<LessonAiFeedbackOutcome> => {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    return {
      feedback: {
        improvements: [
          "특별히 다듬을 부분은 없으나 문장이 더 단문 위주로 끊기면 전달력이 극대화될 수 있습니다.",
        ],
        nextAction: "다음 단계로 넘어가 다른 유형의 문장을 실습해 보세요.",
        remainingAttempts: 2,
        score: 90,
        scoreRange: [0, 100],
        showScore: true,
        strengths: [
          "수동태 문장을 매끄럽게 능동태로 전환했습니다.",
          "문장의 행위 주체(위원회, 관리자 등)를 명확히 표현했습니다.",
        ],
        summary:
          "훌륭합니다. 피동 표현을 제거하여 문장이 매우 명확하고 생동감 있게 바뀌었습니다.",
      },
      status: "ok",
    }
  }

  const getCheckedFeedback = (
    checkedState: Exclude<false | LessonStepCheckedState, false>
  ) => {
    if (checkedState === "correct") {
      return {
        body: getLessonStepExplanation(step),
        isCorrect: true,
        title: "완벽해요!",
      }
    }

    if (checkedState === "wrong") {
      return {
        body:
          getLessonStepWrongText(step) ??
          getLessonStepExplanation(step) ??
          "다시 생각해보세요.",
        isCorrect: false,
        title: "아쉽지만 달라요",
      }
    }

    const isCorrect =
      checkedState.wrong.length === 0 && checkedState.missed.length === 0

    return {
      body: isCorrect
        ? (checkedState.explanation ?? "")
        : `잘못 선택: ${checkedState.wrong.length}개, 놓침: ${checkedState.missed.length}개`,
      isCorrect,
      title: isCorrect ? "정확해요!" : "다시 확인해보세요",
    }
  }

  const feedback = checked !== false ? getCheckedFeedback(checked) : null
  const stepSchema =
    lessonStepDefinitions[selectedType as keyof typeof lessonStepDefinitions]
      ?.schema

  const renderPreviewActionBar = () => {
    if (hideOuterActionBar) {
      return null
    }

    if (checked === false) {
      return (
        <Button
          className="w-full font-bold"
          disabled={!isReady}
          onClick={isCheckable ? handleSubmit : undefined}
          size="extra"
          variant={isReady ? "default" : "secondary"}
        >
          {actionLabel}
        </Button>
      )
    }

    if (feedback === null) {
      return null
    }

    return (
      <div className="an-su">
        <div
          className={cn(
            "h-1 -mx-6 mb-5",
            feedback.isCorrect ? "bg-mint-light" : "bg-coral-light"
          )}
        />
        <p
          className={cn(
            "font-black mb-2",
            feedback.isCorrect ? "text-mint-dark" : "text-coral-dark"
          )}
          style={{ fontSize: "1.25rem" }}
        >
          {feedback.title}
        </p>
        {feedback.body !== "" ? (
          <p
            className="text-muted-foreground font-medium mb-5"
            style={{ fontSize: "1rem" }}
          >
            {feedback.body}
          </p>
        ) : null}
        <Button
          className="w-full font-bold"
          onClick={handleReset}
          size="extra"
          variant={feedback.isCorrect ? "correct" : "wrong"}
        >
          다시 시도
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        description="모든 스텝 타입의 스키마, 샘플 데이터, 렌더러 UI를 확인합니다"
        title="스텝 디버그"
      />
      <div className="flex flex-1 min-h-0 border-t border-border">
        <nav
          aria-label="스텝 타입 목록"
          className="w-80 shrink-0 overflow-y-auto border-r border-border px-6 py-8"
        >
          <div className="mb-6">
            <h1 className="font-black mb-2" style={{ fontSize: "1.5rem" }}>
              스텝 투어
            </h1>
            <p
              className="text-muted-foreground font-medium"
              style={{ fontSize: "0.875rem" }}
            >
              모든 스텝 타입의 UI/UX를 한 곳에서 확인하세요.
            </p>
          </div>
          <button
            className="w-full mb-6 flex items-center justify-center gap-2 bg-surface text-charcoal font-bold py-3 rounded-3xl btn-squish"
            onClick={handleReset}
            style={{ fontSize: "0.875rem" }}
            type="button"
          >
            <RotateCcw size={16} />
            현재 스텝 초기화
          </button>
          <div className="space-y-2">
            {STEP_DEBUG_ENTRIES.map((entry) => {
              const isActive = entry.type === selectedType

              return (
                <button
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-3xl font-bold transition-colors flex items-start gap-3 btn-squish",
                    isActive
                      ? "bg-charcoal text-cream"
                      : "bg-surface text-charcoal hover:bg-surface/70"
                  )}
                  key={entry.type}
                  onClick={() => setSelectedType(entry.type)}
                  style={{ fontSize: "0.9375rem" }}
                  type="button"
                >
                  <span style={{ fontSize: "1.125rem" }}>{entry.icon}</span>
                  <span className="flex-1">
                    <span className="block">{entry.label}</span>
                    <span
                      className={cn(
                        "block font-medium mt-0.5",
                        isActive ? "text-cream/70" : "text-muted-foreground"
                      )}
                      style={{ fontSize: "0.75rem" }}
                    >
                      {entry.desc}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </nav>

        <main
          aria-label={`${selectedEntry.label} 스텝 디버그`}
          className="flex-1 overflow-y-auto px-6 py-10 md:px-12"
        >
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <div
                  className="text-muted-foreground font-bold tracking-widest mb-1"
                  style={{ fontSize: "0.75rem" }}
                >
                  STEP TYPE
                </div>
                <div className="font-black" style={{ fontSize: "1.25rem" }}>
                  {selectedEntry.icon} {selectedEntry.label}
                </div>
              </div>
            </div>

            <section aria-labelledby="preview-heading">
              <h2
                className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground"
                id="preview-heading"
              >
                렌더러 미리보기
              </h2>
              <div className="max-w-sm mx-auto w-full">
                <div
                  className="relative bg-cream rounded-3xl overflow-hidden shadow-xl border border-surface"
                  data-density="comfortable"
                  style={{ height: "680px" }}
                >
                  <div className="absolute inset-0 overflow-y-auto pb-48 px-6 pt-8">
                    <LessonStepRenderer
                      checked={checked}
                      key={`${selectedEntry.type}-${previewRevision}`}
                      onAiFeedbackRequest={handleAiFeedbackRequest}
                      onAnswerChange={() => {}}
                      onAnswerPayloadChange={(change) => {
                        setPayload(change.payload)
                      }}
                      step={selectedEntry.sample}
                    />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 px-6 pb-8 pt-10 bg-gradient-to-t from-cream via-cream to-transparent">
                    {renderPreviewActionBar()}
                  </div>
                </div>
              </div>
            </section>

            {stepSchema !== undefined ? (
              <section aria-labelledby="schema-heading">
                <h2
                  className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground"
                  id="schema-heading"
                >
                  스키마 & 데이터
                </h2>
                <StepDebugPanel
                  data={selectedEntry.dto}
                  schema={stepSchema}
                  title={selectedEntry.type}
                />
              </section>
            ) : null}

            <section aria-labelledby="validation-heading">
              <h2
                className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground"
                id="validation-heading"
              >
                Zod 검증 결과
              </h2>
              <StepDebugValidation sample={selectedEntry.dto} />
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}
