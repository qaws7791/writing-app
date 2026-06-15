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
  getLessonStepDescription,
  getLessonStepTitle,
  isLessonStepStandalone,
} from "@/features/lessons/lesson-step-policy"
import type {
  AiFeedbackStep,
  CategorizeStep,
  FillBlankStep,
  MatchStep,
  MultipleChoiceStep,
  OrderStep,
  SelectStep,
  WriteStep,
  LessonStep,
} from "@/features/lessons/lesson-types"
import { Button } from "@workspace/ui/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/ui/card"

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
    return renderStepContent(step, {
      checked,
      onAiFeedbackRequest,
      onAnswerChange,
      onAnswerPayloadChange,
    })
  }

  const headingId = `lesson-step-${step.id}`

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-5">
      <p className="text-sm font-medium text-primary">
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
          {answerError === undefined || answerError === null ? null : (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {answerError}
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  )
}

function renderStepContent(
  step: LessonStep,
  handlers: {
    readonly checked: LessonStepCheckedState
    readonly onAiFeedbackRequest: LessonStepRendererProps["onAiFeedbackRequest"]
    readonly onAnswerChange: LessonStepRendererProps["onAnswerChange"]
    readonly onAnswerPayloadChange: LessonStepRendererProps["onAnswerPayloadChange"]
  }
) {
  switch (step.type) {
    case "AI_FEEDBACK":
      return (
        <AiFeedbackAnswer
          onAiFeedbackRequest={handlers.onAiFeedbackRequest}
          step={step}
        />
      )
    case "CATEGORIZE":
      return (
        <CategorizeAnswer
          checked={handlers.checked}
          onAnswerChange={handlers.onAnswerChange}
          onAnswerPayloadChange={handlers.onAnswerPayloadChange}
          step={step}
        />
      )
    case "COMPARE":
      return (
        <div className="grid gap-3 md:grid-cols-2">
          {step.versions.map((version) => (
            <div
              className="rounded-lg border border-border px-4 py-3"
              key={version.label}
            >
              <p className="font-medium">{version.label}</p>
              <p className="mt-2 leading-7 text-muted-foreground">
                {version.text}
              </p>
            </div>
          ))}
        </div>
      )
    case "FILL_BLANK":
      return (
        <FillBlankAnswer onAnswerChange={handlers.onAnswerChange} step={step} />
      )
    case "MATCH":
      return (
        <MatchAnswer
          checked={handlers.checked}
          onAnswerChange={handlers.onAnswerChange}
          onAnswerPayloadChange={handlers.onAnswerPayloadChange}
          step={step}
        />
      )
    case "MULTIPLE_CHOICE":
      return (
        <MultipleChoiceAnswer
          checked={handlers.checked}
          onAnswerChange={handlers.onAnswerChange}
          onAnswerPayloadChange={handlers.onAnswerPayloadChange}
          step={step}
        />
      )
    case "ORDER":
      return (
        <OrderAnswer onAnswerChange={handlers.onAnswerChange} step={step} />
      )
    case "READING":
      return <ReadingStepView step={step} />
    case "SELECT":
      return (
        <SelectAnswer onAnswerChange={handlers.onAnswerChange} step={step} />
      )
    case "WRITE":
      return (
        <WriteAnswer
          checked={handlers.checked}
          onAnswerChange={handlers.onAnswerChange}
          onAnswerPayloadChange={handlers.onAnswerPayloadChange}
          step={step}
        />
      )
  }
}

function ReadingStepView({
  step,
}: {
  readonly step: LessonStep & { type: "READING" }
}) {
  return (
    <div className="an-fi">
      <h2 className="font-bold mb-2" style={{ fontSize: "1.5rem" }}>
        {step.title}
      </h2>
      {step.guide === "" ? null : (
        <div className="prose prose-sm max-w-none mb-6 prose-headings:font-bold prose-headings:text-charcoal prose-p:text-muted prose-p:font-medium prose-strong:text-charcoal prose-li:text-muted prose-li:font-medium prose-code:bg-surface prose-code:rounded prose-code:px-1 prose-code:text-charcoal prose-blockquote:border-primary prose-blockquote:text-muted">
          <ReactMarkdown>{step.guide}</ReactMarkdown>
        </div>
      )}
      <div className="prose prose-sm max-w-none mb-6 prose-headings:font-bold prose-headings:text-charcoal prose-p:text-charcoal/80 prose-p:font-medium prose-strong:text-charcoal prose-li:text-charcoal/80 prose-li:font-medium prose-code:bg-surface prose-code:rounded prose-code:px-1 prose-code:text-charcoal prose-blockquote:border-primary prose-blockquote:text-muted prose-hr:border-surface">
        <ReactMarkdown>{step.body}</ReactMarkdown>
      </div>
      {step.source === undefined ? null : (
        <div className="text-muted font-bold" style={{ fontSize: "0.8125rem" }}>
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
        <p className="rounded-lg border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
          AI 코칭을 준비하고 있습니다.
        </p>
      ) : null}
      {error === null ? null : (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}
      {feedback === null ? null : <AiFeedbackResultView feedback={feedback} />}
      {canRetry ? null : feedback === null ? null : (
        <p className="text-sm text-muted-foreground">
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
    <div className="flex flex-col gap-4 rounded-lg border border-border px-4 py-4">
      <div className="flex flex-col gap-2">
        <h2 className="font-medium">총평</h2>
        <p className="leading-7 text-muted-foreground">{feedback.summary}</p>
        {feedback.showScore ? (
          <p className="text-sm text-muted-foreground">
            {feedback.score}/{feedback.scoreRange[1]}점
          </p>
        ) : null}
      </div>
      <FeedbackList items={feedback.strengths} title="잘된 점" />
      <FeedbackList items={feedback.improvements} title="다듬을 점" />
      <div className="flex flex-col gap-2">
        <h2 className="font-medium">다음 시도</h2>
        <p className="leading-7 text-muted-foreground">{feedback.nextAction}</p>
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
      <ul className="flex flex-col gap-1 text-muted-foreground">
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
      <h2
        className="font-bold mb-8"
        style={{ fontSize: "1.625rem", lineHeight: 1.3 }}
      >
        {step.question}
      </h2>
      <div className="space-y-3">
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
      </div>
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
  const variant = getMultipleChoiceVariant({
    checked,
    optionId,
    selectedOptionId,
    step,
  })
  const colors = MULTIPLE_CHOICE_COLORS[variant]
  const faded =
    checked !== false &&
    optionId !== step.correct &&
    selectedOptionId !== optionId

  return (
    <button
      className={cx(
        "w-full px-5 py-4 rounded-3xl text-left font-medium btn-squish transition-colors",
        colors.bg,
        colors.text,
        faded ? "opacity-40" : undefined
      )}
      disabled={faded}
      onClick={onSelect}
      style={{ fontSize: "1rem" }}
      type="button"
    >
      {children}
    </button>
  )
}

function getMultipleChoiceVariant({
  checked,
  optionId,
  selectedOptionId,
  step,
}: {
  readonly checked: LessonStepCheckedState
  readonly optionId: string
  readonly selectedOptionId: null | string
  readonly step: MultipleChoiceStep
}): keyof typeof MULTIPLE_CHOICE_COLORS {
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
    return "primary"
  }

  return "secondary"
}

const MULTIPLE_CHOICE_COLORS = {
  correct: {
    bg: "bg-mint-light",
    text: "text-mint-dark",
  },
  primary: {
    bg: "bg-primary",
    text: "text-ink",
  },
  secondary: {
    bg: "bg-surface",
    text: "text-charcoal",
  },
  wrong: {
    bg: "bg-coral-light",
    text: "text-coral-dark",
  },
} as const

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
        <p className="text-sm text-muted-foreground">
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
  const [matchMap, setMatchMap] = useState<Readonly<Record<number, string>>>({})
  const [selectedLeft, setSelectedLeft] = useState<null | number>(null)
  const lefts = step.pairs.map((pair) => pair.left)
  const rights = step.pairs.map((pair) => pair.right)

  const shuffledRights = useMemo(() => {
    const seed = step.pairs.map((pair) => pair.right).join("")
    const nextRights = [...rights]
    let hash = 0

    for (let index = 0; index < seed.length; index += 1) {
      hash = (Math.imul(31, hash) + seed.charCodeAt(index)) | 0
    }

    for (let index = nextRights.length - 1; index > 0; index -= 1) {
      hash = (Math.imul(hash, 1664525) + 1013904223) | 0
      const swapIndex = Math.abs(hash) % (index + 1)
      const current = nextRights[index]
      const swap = nextRights[swapIndex]

      if (current !== undefined && swap !== undefined) {
        nextRights[index] = swap
        nextRights[swapIndex] = current
      }
    }

    return nextRights
  }, [rights, step.pairs])

  function matchedLeftForRight(right: string): null | number {
    const entry = Object.entries(matchMap).find(([, value]) => value === right)

    return entry === undefined ? null : Number(entry[0])
  }

  function handleLeftTap(index: number) {
    if (checked !== false) {
      return
    }

    setSelectedLeft((previous) => (previous === index ? null : index))
  }

  function handleRightTap(right: string) {
    if (checked !== false || selectedLeft === null) {
      return
    }

    const nextMap: Record<number, string> = {
      ...matchMap,
    }

    if (nextMap[selectedLeft] === right) {
      delete nextMap[selectedLeft]
    } else {
      const previousLeft = matchedLeftForRight(right)

      if (previousLeft !== null) {
        delete nextMap[previousLeft]
      }

      nextMap[selectedLeft] = right
    }

    setMatchMap(nextMap)
    emitAnswer(
      onAnswerChange,
      step.id,
      {
        pairs: step.pairs.flatMap((pair, index) => {
          const matchedRight = nextMap[index]

          return matchedRight === undefined
            ? []
            : [
                {
                  left: pair.left,
                  right: matchedRight,
                },
              ]
        }),
        type: "MATCH",
      },
      onAnswerPayloadChange
    )
    setSelectedLeft(null)
  }

  return (
    <div className="an-fi">
      <h2
        className="font-bold mb-2"
        style={{ fontSize: "1.625rem", lineHeight: 1.3 }}
      >
        {step.title || "짝을 맞춰보세요"}
      </h2>
      {step.guide ? (
        <div className="prose prose-sm max-w-none mb-6 prose-headings:font-bold prose-headings:text-charcoal prose-p:text-muted prose-p:font-medium prose-strong:text-charcoal prose-li:text-muted prose-li:font-medium prose-code:bg-surface prose-code:rounded prose-code:px-1 prose-code:text-charcoal prose-blockquote:border-primary prose-blockquote:text-muted">
          <ReactMarkdown>{step.guide}</ReactMarkdown>
        </div>
      ) : (
        <p className="text-muted font-medium mb-6">
          왼쪽 단어를 탭하고, 오른쪽에서 알맞은 기능을 탭해 짝을 맞추세요.
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-3">
          {lefts.map((left, index) => {
            const matchedRight = matchMap[index]
            const isCorrect =
              checked !== false && matchedRight === rights[index]
            const isWrong =
              checked !== false &&
              matchedRight !== undefined &&
              matchedRight !== rights[index]
            const isActive = selectedLeft === index
            const isPaired = matchedRight !== undefined

            return (
              <button
                className={cx(
                  "w-full rounded-3xl p-4 font-bold text-center transition-all duration-150 active:scale-95",
                  isCorrect
                    ? "bg-mint-light text-charcoal"
                    : isWrong
                      ? "bg-coral-light text-charcoal"
                      : isActive
                        ? "bg-charcoal text-cream shadow-lg scale-[1.02]"
                        : isPaired
                          ? "bg-primary text-ink"
                          : "bg-surface text-charcoal"
                )}
                disabled={checked !== false}
                key={left}
                onClick={() => handleLeftTap(index)}
                style={{ fontSize: "1rem", minHeight: "3.5rem" }}
                type="button"
              >
                {left}
              </button>
            )
          })}
        </div>
        <div className="flex flex-col gap-3">
          {shuffledRights.map((right) => {
            const pairedLeftIndex = matchedLeftForRight(right)
            const isPaired = pairedLeftIndex !== null
            const isHighlighted =
              selectedLeft !== null && matchMap[selectedLeft] === right
            const isCorrect =
              checked !== false && isPaired && rights[pairedLeftIndex] === right
            const isWrong =
              checked !== false && isPaired && rights[pairedLeftIndex] !== right

            return (
              <button
                className={cx(
                  "w-full rounded-3xl p-4 font-bold text-center transition-all duration-150 active:scale-95",
                  isCorrect
                    ? "bg-mint-light text-charcoal"
                    : isWrong
                      ? "bg-coral-light text-charcoal"
                      : isHighlighted
                        ? "bg-primary text-ink ring-2 ring-charcoal"
                        : isPaired
                          ? "bg-primary text-ink"
                          : selectedLeft !== null
                            ? "bg-surface text-charcoal hover:bg-primary/50"
                            : "bg-surface text-muted"
                )}
                disabled={checked !== false || selectedLeft === null}
                key={right}
                onClick={() => handleRightTap(right)}
                style={{ fontSize: "1rem", minHeight: "3.5rem" }}
                type="button"
              >
                {right}
              </button>
            )
          })}
        </div>
      </div>
      {checked !== false && step.explanation ? (
        <div className="mt-6 bg-surface rounded-4xl p-6">
          <div className="font-bold text-muted mb-2">해설</div>
          <p className="font-medium">{step.explanation}</p>
        </div>
      ) : null}
    </div>
  )
}

const CATEGORY_PALETTE = [
  {
    activeRing: "ring-charcoal/50",
    base: "bg-charcoal text-cream",
    cardBg: "bg-charcoal/10",
  },
  {
    activeRing: "ring-primary",
    base: "bg-primary text-ink",
    cardBg: "bg-primary/25",
  },
  {
    activeRing: "ring-mint",
    base: "bg-mint text-ink",
    cardBg: "bg-mint/20",
  },
  {
    activeRing: "ring-coral/60",
    base: "bg-coral text-ink",
    cardBg: "bg-coral/10",
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
        <h2
          className="font-bold mb-2"
          style={{ fontSize: "1.625rem", lineHeight: 1.3 }}
        >
          {step.title || "항목을 분류하세요"}
        </h2>
        {step.guide ? (
          <div className="prose prose-sm max-w-none mb-5 prose-headings:font-bold prose-headings:text-charcoal prose-p:text-muted prose-p:font-medium prose-strong:text-charcoal prose-li:text-muted prose-li:font-medium prose-code:bg-surface prose-code:rounded prose-code:px-1 prose-code:text-charcoal prose-blockquote:border-primary prose-blockquote:text-muted">
            <ReactMarkdown>{step.guide}</ReactMarkdown>
          </div>
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
                className={cx(
                  "rounded-3xl px-4 py-3.5 transition-all duration-200",
                  isCorrect
                    ? "bg-mint-light"
                    : isWrong
                      ? "bg-coral-light"
                      : isTagged && palette !== null
                        ? palette.cardBg
                        : "bg-surface",
                  isClickable ? "cursor-pointer btn-squish" : "",
                  isClickable && !isTagged
                    ? "ring-2 ring-charcoal/20 ring-offset-1"
                    : ""
                )}
                key={item.id}
                onClick={() => handleItemTap(item.id)}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  {isTagged && category != null && palette !== null ? (
                    <span
                      className={cx(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 font-bold shrink-0",
                        palette.base
                      )}
                      style={{ fontSize: "0.75rem" }}
                    >
                      {category.label}
                    </span>
                  ) : null}
                  <span
                    className="font-bold text-charcoal flex-1"
                    style={{ fontSize: "0.9375rem" }}
                  >
                    {item.text}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
        {checked !== false && step.explanation ? (
          <div className="mt-2 bg-surface rounded-4xl p-6 an-fi">
            <div className="font-bold text-muted mb-2">해설</div>
            <p className="font-medium">{step.explanation}</p>
          </div>
        ) : null}
      </div>
      {checked === false ? (
        <div className="-mx-6 mt-auto shrink-0 px-6 pt-5 pb-3 bg-gradient-to-t from-cream via-cream to-transparent">
          <div
            className="font-bold text-muted mb-2 tracking-widest"
            style={{ fontSize: "0.75rem" }}
          >
            태그 선택
          </div>
          <div className="flex flex-wrap gap-2">
            {step.categories.map((category, index) => {
              const palette = getCategoryPalette(index)
              const isActive = activeTagId === category.id

              return (
                <button
                  className={cx(
                    "rounded-full px-4 py-2 font-bold btn-squish transition-all duration-150",
                    palette.base,
                    isActive
                      ? cx("scale-95 ring-4 opacity-75", palette.activeRing)
                      : ""
                  )}
                  key={category.id}
                  onClick={() => handleTagTap(category.id)}
                  style={{ fontSize: "0.875rem" }}
                  type="button"
                >
                  {category.label}
                </button>
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
      <h2
        className="font-bold mb-3"
        style={{ fontSize: "1.625rem", lineHeight: 1.3 }}
      >
        {title}
      </h2>
      {badge === null ? null : (
        <div
          className="inline-block bg-charcoal/5 text-charcoal font-bold px-4 py-2 rounded-full mb-4"
          style={{ fontSize: "0.875rem" }}
        >
          {badge}
        </div>
      )}
      {step.claim === undefined ? null : (
        <div className="bg-primary/20 rounded-4xl p-5 mb-4">
          <div
            className="font-bold text-muted mb-2"
            style={{ fontSize: "0.8125rem" }}
          >
            {claimLabel}
          </div>
          <p className="font-medium" style={{ fontSize: "1.0625rem" }}>
            {step.claim}
          </p>
        </div>
      )}
      {guide ? (
        <div className="prose prose-sm max-w-none mb-4 prose-headings:font-bold prose-headings:text-charcoal prose-p:text-muted prose-p:font-medium prose-strong:text-charcoal prose-li:text-muted prose-li:font-medium prose-code:bg-surface prose-code:rounded prose-code:px-1 prose-code:text-charcoal prose-blockquote:border-primary prose-blockquote:text-muted">
          <ReactMarkdown>{guide}</ReactMarkdown>
        </div>
      ) : null}
      {step.reference === undefined ? null : (
        <div className="bg-surface rounded-4xl p-5 mb-4 text-muted font-medium">
          <div
            className="font-bold text-muted mb-2"
            style={{ fontSize: "0.8125rem" }}
          >
            참고 원문
          </div>
          {step.reference}
        </div>
      )}
      {step.structure === undefined ? null : (
        <div className="bg-surface rounded-4xl p-5 mb-4">
          <div
            className="font-bold text-muted mb-2"
            style={{ fontSize: "0.8125rem" }}
          >
            구조 가이드
          </div>
          <p className="font-medium whitespace-pre-line">{step.structure}</p>
        </div>
      )}
      <textarea
        className={`w-full bg-surface rounded-4xl p-6 font-medium outline-none resize-none ${minHeight}`}
        disabled={checked !== false}
        onChange={(event) => handleChange(event.target.value)}
        placeholder={placeholder}
        style={{ fontSize: "1.0625rem" }}
        value={text}
      />
      <div
        className="mt-4 flex justify-between items-center text-muted font-bold"
        style={{ fontSize: "0.875rem" }}
      >
        <span>
          {text.length}자 · 최소 {min}
          {goal === undefined ? "" : ` · 목표 ${goal}`}
          {` · 최대 ${max}`}
        </span>
        <span
          className={cx(
            text.length >= min ? "text-mint-dark" : "text-coral-dark"
          )}
        >
          {text.length >= min ? "✓" : "✗"}
        </span>
      </div>
      {step.draft ? (
        <button
          className="mt-4 inline-flex items-center gap-2 text-muted font-bold hover:text-charcoal"
          onClick={() => {
            setDraftSaved(true)
            setTimeout(() => setDraftSaved(false), 2000)
          }}
          style={{ fontSize: "0.875rem" }}
          type="button"
        >
          {draftSaved ? "저장됨" : "드래프트 저장"}
        </button>
      ) : null}
      {checked !== false && step.sample !== undefined ? (
        <div className="mt-6 bg-surface rounded-4xl p-6">
          <div className="font-bold text-muted mb-2">참조 답안</div>
          <p className="font-medium whitespace-pre-line">{step.sample}</p>
        </div>
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

function cx(...classes: Array<false | null | string | undefined>): string {
  return classes.filter(Boolean).join(" ")
}
