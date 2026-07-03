"use client"

import { useState } from "react"

import { lessonStepDefinitions } from "@workspace/contracts/content/steps"
import {
  getLessonStepActionLabel,
  getLessonStepCheckedResult,
  getLessonStepExplanation,
  getLessonStepWrongText,
  isLessonStepCheckable,
  isLessonStepSubmittable,
  LessonStepRenderer,
  type LessonAiFeedbackOutcome,
  type LessonAiFeedbackRequest,
  type LessonStepAnswerPayload,
  type LessonStepCheckedState,
} from "@workspace/lesson"
import {
  Button,
  Callout,
  CalloutContent,
  CalloutTitle,
  PageHeader,
} from "@workspace/ui"

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

  // 스텝 타입 변경 시 상태 리셋 (렌더링 중 동기화)
  if (selectedType !== prevSelectedType) {
    setPrevSelectedType(selectedType)
    setPayload(undefined)
    setChecked(false)
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

  const handleSubmit = () => {
    if (checked === false && isCheckable) {
      setChecked(getLessonStepCheckedResult(step, payload))
    }
  }

  const handleReset = () => {
    setPayload(undefined)
    setChecked(false)
  }

  // Mock AI 피드백
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

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        description="모든 스텝 타입의 스키마, 샘플 데이터, 렌더러 UI를 확인합니다"
        title="스텝 디버그"
      />
      <div className="flex flex-1 min-h-0 gap-0 border-t border-border">
        {/* 사이드바 */}
        <nav
          aria-label="스텝 타입 목록"
          className="w-56 shrink-0 border-r border-border overflow-y-auto bg-background"
        >
          <ul className="py-2">
            {STEP_DEBUG_ENTRIES.map((entry) => {
              const isActive = entry.type === selectedType

              return (
                <li key={entry.type}>
                  <button
                    className={[
                      "w-full text-left px-4 py-3 flex items-center gap-3 transition-colors cursor-pointer",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    ].join(" ")}
                    onClick={() => setSelectedType(entry.type)}
                    type="button"
                  >
                    <span className="text-lg" aria-hidden>
                      {entry.icon}
                    </span>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-xs font-bold truncate">
                        {entry.type}
                      </span>
                      <span className="text-[10px] truncate opacity-60">
                        {entry.desc}
                      </span>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* 메인 영역 */}
        <main
          aria-label={`${selectedEntry.label} 스텝 디버그`}
          className="flex-1 overflow-y-auto"
        >
          <div className="mx-auto max-w-2xl px-6 py-8 flex flex-col gap-6">
            {/* 스텝 타입 헤더 */}
            <div className="flex items-center gap-3">
              <span className="text-3xl" aria-hidden>
                {selectedEntry.icon}
              </span>
              <div>
                <h1 className="text-lg font-bold">{selectedEntry.label}</h1>
                <p className="text-sm text-muted-foreground">
                  {selectedEntry.desc}
                </p>
              </div>
            </div>

            {/* 렌더러 미리보기 */}
            <section aria-labelledby="preview-heading">
              <h2
                className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground"
                id="preview-heading"
              >
                렌더러 미리보기
              </h2>
              <div className="rounded-xl border border-border bg-background p-6 flex flex-col gap-5">
                <LessonStepRenderer
                  checked={checked}
                  onAiFeedbackRequest={handleAiFeedbackRequest}
                  onAnswerChange={() => {}}
                  onAnswerPayloadChange={(change) => {
                    setPayload(change.payload)
                  }}
                  step={selectedEntry.sample}
                  stepIndex={0}
                  totalSteps={STEP_DEBUG_ENTRIES.length}
                />

                {/* 액션 버튼 및 피드백 시뮬레이터 */}
                <div className="mt-2 pt-4 border-t border-border flex flex-col gap-4">
                  {checked === false ? (
                    <Button
                      className="w-full"
                      disabled={!isReady}
                      onClick={isCheckable ? handleSubmit : handleReset}
                      size="lg"
                      variant={isReady ? "default" : "secondary"}
                    >
                      {actionLabel}
                    </Button>
                  ) : (
                    feedback !== null && (
                      <div className="grid gap-4 an-su">
                        <Callout
                          tone={feedback.isCorrect ? "success" : "danger"}
                        >
                          <CalloutTitle className="text-[1.15rem] font-black">
                            {feedback.title}
                          </CalloutTitle>
                          {feedback.body !== "" ? (
                            <CalloutContent>{feedback.body}</CalloutContent>
                          ) : null}
                        </Callout>
                        <Button
                          className="w-full"
                          onClick={handleReset}
                          size="lg"
                          variant={feedback.isCorrect ? "correct" : "wrong"}
                        >
                          다시 풀기
                        </Button>
                      </div>
                    )
                  )}
                </div>
              </div>
            </section>

            {/* 디버그 패널 */}
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

            {/* 검증 결과 */}
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
