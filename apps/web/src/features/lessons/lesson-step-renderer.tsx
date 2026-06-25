"use client"

import type { ReactNode } from "react"
import { useMemo, useState } from "react"

import ReactMarkdown from "react-markdown"

import {
  createLessonStepAnswer,
  type LessonAiFeedback,
  type LessonAiFeedbackOutcome,
  type LessonAiFeedbackRequest,
  type LessonAnswerChange,
  type LessonStepAnswerPayload,
} from "@/features/lessons/lesson-logic"
import {
  createMatchStepPresentation,
  findMatchedLeftChoiceIdForRightChoiceId,
  isCorrectMatchChoice,
  toMatchAnswerPairs,
  toggleMatchSelection,
  type MatchChoiceId,
  type MatchSelectionMap,
} from "@/features/lessons/lesson-match-presentation"
import {
  getLessonStepDescription,
  getLessonStepTitle,
  isLessonStepStandalone,
} from "@/features/lessons/lesson-step-policy"
import type {
  AiFeedbackStep,
  CategorizeStep,
  CompareStep,
  FillBlankStep,
  MatchStep,
  MultipleChoiceStep,
  OrderStep,
  SelectStep,
  WriteStep,
  LessonStep,
} from "@/features/lessons/lesson-types"
import { Badge } from "@workspace/ui/components/ui/badge"
import { Button } from "@workspace/ui/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/ui/card"
import {
  ChoiceCard,
  ChoiceCardGroup,
} from "@workspace/ui/components/ui/choice-card"
import { RichText } from "@workspace/ui/components/ui/rich-text"
import { Surface } from "@workspace/ui/components/ui/surface"
import { Textarea } from "@workspace/ui/components/ui/textarea"
import { cn } from "@workspace/ui/lib/utils"

type LessonStepRendererProps = {
  readonly step: LessonStep
  readonly stepIndex: number
  readonly totalSteps: number
  readonly answerError?: null | string
  readonly checked?: LessonStepCheckedState
  readonly onAiFeedbackRequest?: (
    request: LessonAiFeedbackRequest
  ) => Promise<LessonAiFeedbackOutcome>
  readonly onAnswerChange?: (change: LessonAnswerChange) => Promise<void> | void
  readonly onAnswerPayloadChange?: (change: LessonAnswerPayloadChange) => void
}

type LessonStepCheckedState =
  | false
  | "ai_done"
  | "correct"
  | "wrong"
  | {
      readonly explanation?: string
      readonly missed: readonly number[]
      readonly wrong: readonly number[]
    }

type LessonAnswerPayloadChange = {
  readonly payload: LessonStepAnswerPayload
  readonly stepId: string
}

type LessonStepContentHandlers = {
  readonly checked: LessonStepCheckedState
  readonly onAiFeedbackRequest: LessonStepRendererProps["onAiFeedbackRequest"]
  readonly onAnswerChange: LessonStepRendererProps["onAnswerChange"]
  readonly onAnswerPayloadChange: LessonStepRendererProps["onAnswerPayloadChange"]
}

type LessonStepByType<TType extends LessonStep["type"]> = Extract<
  LessonStep,
  { readonly type: TType }
>

type LessonStepContentRenderer<TType extends LessonStep["type"]> = (
  step: LessonStepByType<TType>,
  handlers: LessonStepContentHandlers
) => ReactNode

type LessonStepContentRendererRegistry = {
  readonly [TType in LessonStep["type"]]: LessonStepContentRenderer<TType>
}

export function LessonStepRenderer({
  answerError,
  checked = false,
  onAiFeedbackRequest,
  onAnswerChange,
  onAnswerPayloadChange,
  step,
  stepIndex,
  totalSteps,
}: LessonStepRendererProps) {
  if (isLessonStepStandalone(step)) {
    return (
      <>
        {renderStepContent(step, {
          checked,
          onAiFeedbackRequest,
          onAnswerChange,
          onAnswerPayloadChange,
        })}
        <LessonAnswerErrorMessage answerError={answerError} />
      </>
    )
  }

  const headingId = `lesson-step-${step.id}`

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-5">
      <p className="text-sm font-medium text-fg-muted">
        {stepIndex + 1}/{totalSteps} 스텝
      </p>
      <Card>
        <CardHeader>
          <CardTitle as="h1" id={headingId}>
            {getLessonStepTitle(step)}
          </CardTitle>
          <CardDescription>{getLessonStepDescription(step)}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {renderStepContent(step, {
            checked,
            onAiFeedbackRequest,
            onAnswerChange,
            onAnswerPayloadChange,
          })}
          <LessonAnswerErrorMessage answerError={answerError} />
        </CardContent>
      </Card>
    </section>
  )
}

function LessonAnswerErrorMessage({
  answerError,
}: {
  readonly answerError?: null | string
}) {
  if (answerError === undefined || answerError === null) {
    return null
  }

  return (
    <p className="rounded-lg border border-danger-fg/30 bg-danger-bg/15 px-4 py-3 text-sm text-danger-fg">
      {answerError}
    </p>
  )
}

function MarkdownRichText({
  children,
  className,
}: {
  readonly children: string
  readonly className?: string
}) {
  return (
    <RichText className={className}>
      <ReactMarkdown>{children}</ReactMarkdown>
    </RichText>
  )
}

function renderStepContent(
  step: LessonStep,
  handlers: LessonStepContentHandlers
) {
  const renderer = stepContentRendererByType[step.type] as (
    step: LessonStep,
    handlers: LessonStepContentHandlers
  ) => ReactNode

  return renderer(step, handlers)
}

const stepContentRendererByType = {
  AI_FEEDBACK: (step, handlers) => (
    <AiFeedbackAnswer
      onAiFeedbackRequest={handlers.onAiFeedbackRequest}
      step={step}
    />
  ),
  CATEGORIZE: (step, handlers) => (
    <CategorizeAnswer
      checked={handlers.checked}
      onAnswerChange={handlers.onAnswerChange}
      onAnswerPayloadChange={handlers.onAnswerPayloadChange}
      step={step}
    />
  ),
  COMPARE: (step) => <CompareStepView step={step} />,
  FILL_BLANK: (step, handlers) => (
    <FillBlankAnswer onAnswerChange={handlers.onAnswerChange} step={step} />
  ),
  MATCH: (step, handlers) => (
    <MatchAnswer
      checked={handlers.checked}
      key={step.id}
      onAnswerChange={handlers.onAnswerChange}
      onAnswerPayloadChange={handlers.onAnswerPayloadChange}
      step={step}
    />
  ),
  MULTIPLE_CHOICE: (step, handlers) => (
    <MultipleChoiceAnswer
      checked={handlers.checked}
      onAnswerChange={handlers.onAnswerChange}
      onAnswerPayloadChange={handlers.onAnswerPayloadChange}
      step={step}
    />
  ),
  ORDER: (step, handlers) => (
    <OrderAnswer onAnswerChange={handlers.onAnswerChange} step={step} />
  ),
  READING: (step) => <ReadingStepView step={step} />,
  SELECT: (step, handlers) => (
    <SelectAnswer onAnswerChange={handlers.onAnswerChange} step={step} />
  ),
  WRITE: (step, handlers) => (
    <WriteAnswer
      checked={handlers.checked}
      onAnswerChange={handlers.onAnswerChange}
      onAnswerPayloadChange={handlers.onAnswerPayloadChange}
      step={step}
    />
  ),
} satisfies LessonStepContentRendererRegistry

function CompareStepView({ step }: { readonly step: CompareStep }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {step.versions.map((version) => (
        <div
          className="rounded-lg border border-border-default px-4 py-3"
          key={version.label}
        >
          <p className="font-medium">{version.label}</p>
          <p className="mt-2 leading-7 text-fg-muted">{version.text}</p>
        </div>
      ))}
    </div>
  )
}

function ReadingStepView({
  step,
}: {
  readonly step: LessonStep & { type: "READING" }
}) {
  return (
    <div className="an-fi">
      <h2 className="mb-2 text-heading-sm font-bold">{step.title}</h2>
      {step.guide === "" ? null : (
        <MarkdownRichText className="mb-6">{step.guide}</MarkdownRichText>
      )}
      <MarkdownRichText className="mb-6">{step.body}</MarkdownRichText>
      {step.source === undefined ? null : (
        <div className="text-label-md font-bold text-fg-muted">
          출처: {step.source}
        </div>
      )}
    </div>
  )
}

function AiFeedbackAnswer({
  onAiFeedbackRequest,
  step,
}: {
  readonly onAiFeedbackRequest: LessonStepRendererProps["onAiFeedbackRequest"]
  readonly step: AiFeedbackStep
}) {
  const [error, setError] = useState<null | string>(null)
  const [feedback, setFeedback] = useState<LessonAiFeedback | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleRequest() {
    if (onAiFeedbackRequest === undefined) {
      setError("AI 코칭을 사용할 수 없습니다.")
      return
    }

    setError(null)
    setIsLoading(true)

    const result = await onAiFeedbackRequest({
      answer: step.target,
      stepId: step.id,
    })

    setIsLoading(false)

    if (result.status === "error") {
      setError(result.message)
      return
    }

    setFeedback(result.feedback)
  }

  const canRetry =
    feedback !== null && step.allowRetry && feedback.remainingAttempts > 0

  return (
    <div className="flex flex-col gap-4">
      <p className="leading-7">{step.feedback}</p>
      <Button disabled={isLoading} onClick={handleRequest}>
        {feedback === null ? "AI 코칭 받기" : "다시 받기"}
      </Button>
      {isLoading ? (
        <p className="rounded-lg border border-border-default bg-bg-surface px-4 py-3 text-sm text-fg-muted">
          AI 코칭을 준비하고 있습니다.
        </p>
      ) : null}
      {error === null ? null : (
        <p className="rounded-lg border border-danger-fg/30 bg-danger-bg/15 px-4 py-3 text-sm text-danger-fg">
          {error}
        </p>
      )}
      {feedback === null ? null : <AiFeedbackResultView feedback={feedback} />}
      {canRetry ? null : feedback === null ? null : (
        <p className="text-sm text-fg-muted">
          남은 AI 코칭 시도 횟수가 없습니다.
        </p>
      )}
    </div>
  )
}

function AiFeedbackResultView({
  feedback,
}: {
  readonly feedback: LessonAiFeedback
}) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border-default px-4 py-4">
      <div className="flex flex-col gap-2">
        <h2 className="font-medium">총평</h2>
        <p className="leading-7 text-fg-muted">{feedback.summary}</p>
        {feedback.showScore ? (
          <p className="text-sm text-fg-muted">
            {feedback.score}/{feedback.scoreRange[1]}점
          </p>
        ) : null}
      </div>
      <FeedbackList items={feedback.strengths} title="잘된 점" />
      <FeedbackList items={feedback.improvements} title="다듬을 점" />
      <div className="flex flex-col gap-2">
        <h2 className="font-medium">다음 시도</h2>
        <p className="leading-7 text-fg-muted">{feedback.nextAction}</p>
      </div>
    </div>
  )
}

function FeedbackList({
  items,
  title,
}: {
  readonly items: readonly string[]
  readonly title: string
}) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="font-medium">{title}</h2>
      <ul className="flex flex-col gap-1 text-fg-muted">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

function MultipleChoiceAnswer({
  checked,
  onAnswerChange,
  onAnswerPayloadChange,
  step,
}: {
  readonly checked: LessonStepCheckedState
  readonly onAnswerChange: LessonStepRendererProps["onAnswerChange"]
  readonly onAnswerPayloadChange: LessonStepRendererProps["onAnswerPayloadChange"]
  readonly step: MultipleChoiceStep
}) {
  const [selectedOptionId, setSelectedOptionId] = useState<null | string>(null)

  return (
    <div className="an-fi">
      <h2 className="mb-8 text-heading-sm font-bold">{step.question}</h2>
      <ChoiceCardGroup aria-label="객관식 선택지">
        {step.options.map((option) => (
          <MultipleChoiceOptionButton
            checked={checked}
            key={option.id}
            onSelect={() => {
              if (checked !== false) {
                return
              }

              setSelectedOptionId(option.id)
              emitAnswer(
                onAnswerChange,
                step.id,
                {
                  selectedOptionId: option.id,
                  type: "MULTIPLE_CHOICE",
                },
                onAnswerPayloadChange
              )
            }}
            optionId={option.id}
            selectedOptionId={selectedOptionId}
            step={step}
          >
            {option.text}
          </MultipleChoiceOptionButton>
        ))}
      </ChoiceCardGroup>
    </div>
  )
}

function MultipleChoiceOptionButton({
  checked,
  children,
  onSelect,
  optionId,
  selectedOptionId,
  step,
}: {
  readonly checked: LessonStepCheckedState
  readonly children: ReactNode
  readonly onSelect: () => void
  readonly optionId: string
  readonly selectedOptionId: null | string
  readonly step: MultipleChoiceStep
}) {
  const state = getMultipleChoiceState({
    checked,
    optionId,
    selectedOptionId,
    step,
  })
  const faded =
    checked !== false &&
    optionId !== step.correct &&
    selectedOptionId !== optionId

  return (
    <ChoiceCard
      className={cn(faded ? "opacity-40" : undefined)}
      disabled={faded}
      onClick={onSelect}
      state={state}
    >
      {children}
    </ChoiceCard>
  )
}

function getMultipleChoiceState({
  checked,
  optionId,
  selectedOptionId,
  step,
}: {
  readonly checked: LessonStepCheckedState
  readonly optionId: string
  readonly selectedOptionId: null | string
  readonly step: MultipleChoiceStep
}): "correct" | "idle" | "selected" | "wrong" {
  if (checked === "correct" && optionId === step.correct) {
    return "correct"
  }

  if (
    checked === "wrong" &&
    selectedOptionId === optionId &&
    optionId !== step.correct
  ) {
    return "wrong"
  }

  if (checked === "wrong" && optionId === step.correct) {
    return "correct"
  }

  if (checked === false && selectedOptionId === optionId) {
    return "selected"
  }

  return "idle"
}

function FillBlankAnswer({
  onAnswerChange,
  step,
}: {
  readonly onAnswerChange: LessonStepRendererProps["onAnswerChange"]
  readonly step: FillBlankStep
}) {
  const [selectedWords, setSelectedWords] = useState<readonly string[]>([])

  function handleSelect(word: string) {
    const nextWords = selectedWords.includes(word)
      ? selectedWords.filter((selectedWord) => selectedWord !== word)
      : [...selectedWords, word]

    setSelectedWords(nextWords)
    emitAnswer(onAnswerChange, step.id, {
      selectedWords: nextWords,
      type: "FILL_BLANK",
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="leading-7">{step.template}</p>
      <div className="flex flex-wrap gap-2">
        {step.words.map((word) => (
          <Button
            key={word}
            onClick={() => handleSelect(word)}
            variant={selectedWords.includes(word) ? "default" : "outline"}
          >
            {word}
          </Button>
        ))}
      </div>
    </div>
  )
}

function SelectAnswer({
  onAnswerChange,
  step,
}: {
  readonly onAnswerChange: LessonStepRendererProps["onAnswerChange"]
  readonly step: SelectStep
}) {
  const [selectedIndexes, setSelectedIndexes] = useState<readonly number[]>([])

  function handleSelect(index: number) {
    const nextIndexes = selectedIndexes.includes(index)
      ? selectedIndexes.filter((selectedIndex) => selectedIndex !== index)
      : [...selectedIndexes, index]

    setSelectedIndexes(nextIndexes)
    emitAnswer(onAnswerChange, step.id, {
      selectedIndexes: nextIndexes,
      type: "SELECT",
    })
  }

  return (
    <div className="flex flex-wrap gap-2">
      {step.segments.map((segment, index) => (
        <Button
          key={segment}
          onClick={() => handleSelect(index)}
          variant={selectedIndexes.includes(index) ? "default" : "outline"}
        >
          {segment}
        </Button>
      ))}
    </div>
  )
}

function OrderAnswer({
  onAnswerChange,
  step,
}: {
  readonly onAnswerChange: LessonStepRendererProps["onAnswerChange"]
  readonly step: OrderStep
}) {
  const [orderedItems, setOrderedItems] = useState<readonly string[]>([])

  function handleAppend(item: string) {
    const nextItems = orderedItems.includes(item)
      ? orderedItems
      : [...orderedItems, item]

    setOrderedItems(nextItems)
    emitAnswer(onAnswerChange, step.id, {
      orderedItems: nextItems,
      type: "ORDER",
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        {step.items.map((item) => (
          <Button
            aria-label={`${item} 순서에 추가`}
            className="h-auto justify-start text-left whitespace-normal"
            key={item}
            onClick={() => handleAppend(item)}
            variant="outline"
          >
            {item}
          </Button>
        ))}
      </div>
      {orderedItems.length > 0 ? (
        <p className="text-sm text-fg-muted">
          선택한 순서: {orderedItems.join(" → ")}
        </p>
      ) : null}
    </div>
  )
}

function MatchAnswer({
  checked,
  onAnswerChange,
  onAnswerPayloadChange,
  step,
}: {
  readonly checked: LessonStepCheckedState
  readonly onAnswerChange: LessonStepRendererProps["onAnswerChange"]
  readonly onAnswerPayloadChange: LessonStepRendererProps["onAnswerPayloadChange"]
  readonly step: MatchStep
}) {
  const [matchMap, setMatchMap] = useState<MatchSelectionMap>({})
  const [selectedLeft, setSelectedLeft] = useState<MatchChoiceId | null>(null)
  const presentation = useMemo(() => createMatchStepPresentation(step), [step])

  function handleLeftTap(leftChoiceId: MatchChoiceId) {
    if (checked !== false) {
      return
    }

    setSelectedLeft((previous) =>
      previous === leftChoiceId ? null : leftChoiceId
    )
  }

  function handleRightTap(rightChoiceId: MatchChoiceId) {
    if (checked !== false || selectedLeft === null) {
      return
    }

    const nextMap = toggleMatchSelection(matchMap, {
      leftChoiceId: selectedLeft,
      rightChoiceId,
    })

    setMatchMap(nextMap)
    emitAnswer(
      onAnswerChange,
      step.id,
      {
        pairs: toMatchAnswerPairs(presentation, nextMap),
        type: "MATCH",
      },
      onAnswerPayloadChange
    )
    setSelectedLeft(null)
  }

  return (
    <div className="an-fi">
      <h2 className="mb-2 text-heading-sm font-bold">
        {step.title || "짝을 맞춰보세요"}
      </h2>
      {step.guide ? (
        <MarkdownRichText className="mb-6">{step.guide}</MarkdownRichText>
      ) : (
        <p className="mb-6 text-body-md font-medium text-fg-muted">
          왼쪽 단어를 탭하고, 오른쪽에서 알맞은 기능을 탭해 짝을 맞추세요.
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-3">
          {presentation.leftChoices.map((leftChoice) => {
            const matchedRightChoiceId = matchMap[leftChoice.id]
            const isCorrect =
              checked !== false &&
              matchedRightChoiceId !== undefined &&
              isCorrectMatchChoice(
                presentation,
                leftChoice.id,
                matchedRightChoiceId
              )
            const isWrong =
              checked !== false &&
              matchedRightChoiceId !== undefined &&
              !isCorrectMatchChoice(
                presentation,
                leftChoice.id,
                matchedRightChoiceId
              )
            const isActive = selectedLeft === leftChoice.id
            const isPaired = matchedRightChoiceId !== undefined
            const state = isCorrect
              ? "correct"
              : isWrong
                ? "wrong"
                : isActive || isPaired
                  ? "selected"
                  : "idle"

            return (
              <ChoiceCard
                aria-disabled={checked !== false}
                className={cn(
                  "min-h-14 justify-center text-center",
                  isActive ? "scale-[1.02] shadow-lg" : undefined
                )}
                key={leftChoice.id}
                onClick={() => handleLeftTap(leftChoice.id)}
                state={state}
              >
                {leftChoice.text}
              </ChoiceCard>
            )
          })}
        </div>
        <div className="flex flex-col gap-3">
          {presentation.rightChoices.map((rightChoice) => {
            const pairedLeftChoiceId = findMatchedLeftChoiceIdForRightChoiceId(
              matchMap,
              rightChoice.id
            )
            const isPaired = pairedLeftChoiceId !== null
            const isHighlighted =
              selectedLeft !== null && matchMap[selectedLeft] === rightChoice.id
            const isCorrect =
              checked !== false &&
              pairedLeftChoiceId !== null &&
              isCorrectMatchChoice(
                presentation,
                pairedLeftChoiceId,
                rightChoice.id
              )
            const isWrong =
              checked !== false &&
              pairedLeftChoiceId !== null &&
              !isCorrectMatchChoice(
                presentation,
                pairedLeftChoiceId,
                rightChoice.id
              )
            const state = isCorrect
              ? "correct"
              : isWrong
                ? "wrong"
                : isHighlighted || isPaired
                  ? "selected"
                  : selectedLeft === null
                    ? "disabled"
                    : "idle"

            return (
              <ChoiceCard
                aria-disabled={checked !== false || selectedLeft === null}
                className={cn(
                  "min-h-14 justify-center text-center",
                  isHighlighted ? "ring-2 ring-border-strong" : undefined
                )}
                key={rightChoice.id}
                onClick={() => handleRightTap(rightChoice.id)}
                state={state}
              >
                {rightChoice.text}
              </ChoiceCard>
            )
          })}
        </div>
      </div>
      {checked !== false && step.explanation ? (
        <Surface className="mt-6 rounded-panel" size="md">
          <div className="mb-2 font-bold text-fg-muted">해설</div>
          <p className="font-medium">{step.explanation}</p>
        </Surface>
      ) : null}
    </div>
  )
}

const CATEGORY_PALETTE = [
  {
    activeRing: "ring-border-strong/50",
    base: "bg-bg-inverse text-fg-inverse",
    cardBg: "bg-bg-surface-hover",
  },
  {
    activeRing: "ring-action-selected-bg",
    base: "bg-action-selected-bg text-action-selected-fg",
    cardBg: "bg-action-selected-bg/25",
  },
  {
    activeRing: "ring-success-fg",
    base: "bg-success-bg text-action-selected-fg",
    cardBg: "bg-success-bg/60",
  },
  {
    activeRing: "ring-danger-fg/60",
    base: "bg-danger-bg text-action-selected-fg",
    cardBg: "bg-danger-bg/60",
  },
] as const

function getCategoryPalette(index: number): (typeof CATEGORY_PALETTE)[number] {
  return (
    CATEGORY_PALETTE[index % CATEGORY_PALETTE.length] ??
    getDefaultCategoryPalette()
  )
}

function getDefaultCategoryPalette(): (typeof CATEGORY_PALETTE)[number] {
  const palette = CATEGORY_PALETTE[0]

  if (palette === undefined) {
    throw new Error("카테고리 색상 팔레트가 비어 있습니다.")
  }

  return palette
}

function CategorizeAnswer({
  checked,
  onAnswerChange,
  onAnswerPayloadChange,
  step,
}: {
  readonly checked: LessonStepCheckedState
  readonly onAnswerChange: LessonStepRendererProps["onAnswerChange"]
  readonly onAnswerPayloadChange: LessonStepRendererProps["onAnswerPayloadChange"]
  readonly step: CategorizeStep
}) {
  const [placements, setPlacements] = useState<
    Readonly<Record<string, string>>
  >({})
  const [activeTagId, setActiveTagId] = useState<null | string>(null)

  function getCategoryIndex(categoryId: string): number {
    return step.categories.findIndex((category) => category.id === categoryId)
  }

  function handleTagTap(categoryId: string) {
    if (checked !== false) {
      return
    }

    setActiveTagId((previous) => (previous === categoryId ? null : categoryId))
  }

  function handleItemTap(itemId: string) {
    if (checked !== false || activeTagId === null) {
      return
    }

    const nextPlacements: Record<string, string> = {
      ...placements,
    }

    if (nextPlacements[itemId] === activeTagId) {
      delete nextPlacements[itemId]
    } else {
      nextPlacements[itemId] = activeTagId
    }

    setPlacements(nextPlacements)
    emitAnswer(
      onAnswerChange,
      step.id,
      {
        items: step.items.flatMap((item) => {
          const categoryId = nextPlacements[item.id]

          return categoryId === undefined
            ? []
            : [
                {
                  categoryId,
                  itemId: item.id,
                },
              ]
        }),
        type: "CATEGORIZE",
      },
      onAnswerPayloadChange
    )
  }

  return (
    <div className="select-none flex flex-col" style={{ minHeight: "100%" }}>
      <div className="flex-1">
        <h2 className="mb-2 text-heading-sm font-bold">
          {step.title || "항목을 분류하세요"}
        </h2>
        {step.guide ? (
          <MarkdownRichText className="mb-5">{step.guide}</MarkdownRichText>
        ) : null}
        <div className="flex flex-col gap-3 mb-4">
          {step.items.map((item) => {
            const assignedCategoryId = placements[item.id]
            const categoryIndex =
              assignedCategoryId === undefined
                ? -1
                : getCategoryIndex(assignedCategoryId)
            const palette =
              categoryIndex >= 0 ? getCategoryPalette(categoryIndex) : null
            const category =
              assignedCategoryId === undefined
                ? null
                : step.categories.find(
                    (candidate) => candidate.id === assignedCategoryId
                  )
            const isTagged = assignedCategoryId !== undefined
            const isCorrect =
              checked !== false &&
              isTagged &&
              item.categoryId === assignedCategoryId
            const isWrong =
              checked !== false &&
              isTagged &&
              item.categoryId !== assignedCategoryId
            const isClickable = activeTagId !== null && checked === false

            return (
              <div
                className={cn(
                  "rounded-3xl px-4 py-3.5 transition-all duration-200",
                  isCorrect
                    ? "bg-success-bg"
                    : isWrong
                      ? "bg-danger-bg"
                      : isTagged && palette !== null
                        ? palette.cardBg
                        : "bg-bg-surface",
                  isClickable ? "cursor-pointer btn-squish" : "",
                  isClickable && !isTagged
                    ? "ring-2 ring-border-subtle ring-offset-1"
                    : ""
                )}
                key={item.id}
                onClick={() => handleItemTap(item.id)}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  {isTagged && category != null && palette !== null ? (
                    <Badge className={cn("shrink-0", palette.base)}>
                      {category.label}
                    </Badge>
                  ) : null}
                  <span className="flex-1 text-body-sm font-bold text-fg-default">
                    {item.text}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
        {checked !== false && step.explanation ? (
          <Surface className="mt-2 rounded-panel an-fi" size="md">
            <div className="mb-2 font-bold text-fg-muted">해설</div>
            <p className="font-medium">{step.explanation}</p>
          </Surface>
        ) : null}
      </div>
      {checked === false ? (
        <div className="-mx-6 mt-auto shrink-0 bg-gradient-to-t from-bg-canvas via-bg-canvas to-transparent px-6 pb-3 pt-5">
          <div className="mb-2 text-label-sm font-bold uppercase text-fg-muted">
            태그 선택
          </div>
          <div className="flex flex-wrap gap-2">
            {step.categories.map((category, index) => {
              const palette = getCategoryPalette(index)
              const isActive = activeTagId === category.id

              return (
                <Button
                  className={cn(
                    palette.base,
                    isActive
                      ? cn("scale-95 ring-4 opacity-75", palette.activeRing)
                      : ""
                  )}
                  key={category.id}
                  onClick={() => handleTagTap(category.id)}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  {category.label}
                </Button>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function WriteAnswer({
  checked,
  onAnswerChange,
  onAnswerPayloadChange,
  step,
}: {
  readonly checked: LessonStepCheckedState
  readonly onAnswerChange: LessonStepRendererProps["onAnswerChange"]
  readonly onAnswerPayloadChange: LessonStepRendererProps["onAnswerPayloadChange"]
  readonly step: WriteStep
}) {
  const [text, setText] = useState("")
  const [draftSaved, setDraftSaved] = useState(false)
  const min = step.min || 20
  const max = step.max ?? 2000
  const goal = step.goal
  const title = step.title ?? step.prompt ?? ""
  const guide = step.guide || step.context
  const badge =
    step.badge ??
    (step.mode === "counter"
      ? "반박 쓰기"
      : step.mode === "self-rebut"
        ? "자기 반박"
        : null)
  const claimLabel =
    step.claimLabel ?? (step.mode === "self-rebut" ? "내 주장" : "대상 주장")
  const placeholder =
    step.placeholder ??
    (step.mode === "self-rebut"
      ? "내 주장의 약점을 스스로 짚어보세요..."
      : "여기에 작성하세요...")
  const minHeight = goal
    ? "min-h-[280px]"
    : step.claim
      ? "min-h-[200px]"
      : "min-h-[150px]"

  function handleChange(nextText: string) {
    const slicedText = nextText.slice(0, max)

    setText(slicedText)
    emitAnswer(
      onAnswerChange,
      step.id,
      {
        text: slicedText,
        type: "WRITE",
      },
      onAnswerPayloadChange
    )
  }

  return (
    <div className="an-fi">
      <h2 className="mb-3 text-heading-sm font-bold">{title}</h2>
      {badge === null ? null : (
        <Badge className="mb-4" tone="neutral">
          {badge}
        </Badge>
      )}
      {step.claim === undefined ? null : (
        <Surface
          className="mb-4 rounded-panel bg-action-selected-bg/20"
          size="md"
        >
          <div className="mb-2 text-label-md font-bold text-fg-muted">
            {claimLabel}
          </div>
          <p className="text-body-lg font-medium">{step.claim}</p>
        </Surface>
      )}
      {guide ? (
        <MarkdownRichText className="mb-4">{guide}</MarkdownRichText>
      ) : null}
      {step.reference === undefined ? null : (
        <Surface
          className="mb-4 rounded-panel font-medium text-fg-muted"
          size="md"
        >
          <div className="mb-2 text-label-md font-bold text-fg-muted">
            참고 원문
          </div>
          {step.reference}
        </Surface>
      )}
      {step.structure === undefined ? null : (
        <Surface className="mb-4 rounded-panel" size="md">
          <div className="mb-2 text-label-md font-bold text-fg-muted">
            구조 가이드
          </div>
          <p className="font-medium whitespace-pre-line">{step.structure}</p>
        </Surface>
      )}
      <Textarea
        className={`w-full rounded-panel bg-bg-surface p-6 text-body-lg font-medium outline-none ${minHeight}`}
        disabled={checked !== false}
        onChange={(event) => handleChange(event.target.value)}
        placeholder={placeholder}
        value={text}
      />
      <div className="mt-4 flex items-center justify-between text-label-md font-bold text-fg-muted">
        <span>
          {text.length}자 · 최소 {min}
          {goal === undefined ? "" : ` · 목표 ${goal}`}
          {` · 최대 ${max}`}
        </span>
        <span
          className={cn(
            text.length >= min ? "text-success-fg" : "text-danger-fg"
          )}
        >
          {text.length >= min ? "✓" : "✗"}
        </span>
      </div>
      {step.draft ? (
        <Button
          className="mt-4 h-auto px-0 text-fg-muted hover:text-fg-default"
          onClick={() => {
            setDraftSaved(true)
            setTimeout(() => setDraftSaved(false), 2000)
          }}
          type="button"
          variant="link"
        >
          {draftSaved ? "저장됨" : "드래프트 저장"}
        </Button>
      ) : null}
      {checked !== false && step.sample !== undefined ? (
        <Surface className="mt-6 rounded-panel" size="md">
          <div className="mb-2 font-bold text-fg-muted">참조 답안</div>
          <p className="font-medium whitespace-pre-line">{step.sample}</p>
        </Surface>
      ) : null}
    </div>
  )
}

function emitAnswer(
  onAnswerChange: LessonStepRendererProps["onAnswerChange"],
  stepId: string,
  payload: LessonStepAnswerPayload,
  onAnswerPayloadChange?: LessonStepRendererProps["onAnswerPayloadChange"]
) {
  onAnswerPayloadChange?.({
    payload,
    stepId,
  })

  void onAnswerChange?.({
    answer: createLessonStepAnswer(payload),
    stepId,
  })
}
