"use client"

import { useState } from "react"

import {
  createLessonStepAnswer,
  type LessonAiFeedback,
  type LessonAiFeedbackOutcome,
  type LessonAiFeedbackRequest,
  type LessonAnswerChange,
  type LessonStepAnswerPayload,
} from "@/features/lessons/lesson-logic"
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
  readonly onAiFeedbackRequest?: (
    request: LessonAiFeedbackRequest
  ) => Promise<LessonAiFeedbackOutcome>
  readonly onAnswerChange?: (change: LessonAnswerChange) => Promise<void> | void
}

export function LessonStepRenderer({
  answerError,
  onAiFeedbackRequest,
  onAnswerChange,
  step,
  stepIndex,
  totalSteps,
}: LessonStepRendererProps) {
  const headingId = `lesson-step-${step.id}`

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-5">
      <p className="text-sm font-medium text-primary">
        {stepIndex + 1}/{totalSteps} 스텝
      </p>
      <Card>
        <CardHeader>
          <CardTitle as="h1" id={headingId}>
            {getStepTitle(step)}
          </CardTitle>
          <CardDescription>{getStepDescription(step)}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {renderStepContent(step, {
            onAiFeedbackRequest,
            onAnswerChange,
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

function getStepTitle(step: LessonStep): string {
  switch (step.type) {
    case "AI_FEEDBACK":
      return "AI 코칭"
    case "CATEGORIZE":
    case "COMPARE":
    case "MATCH":
    case "ORDER":
    case "READING":
      return step.title
    case "FILL_BLANK":
      return "빈칸 채우기"
    case "MULTIPLE_CHOICE":
    case "SELECT":
      return step.question
    case "WRITE":
      return step.title ?? "직접 써보기"
  }
}

function getStepDescription(step: LessonStep): string {
  switch (step.type) {
    case "AI_FEEDBACK":
      return step.focus
    case "CATEGORIZE":
    case "MATCH":
    case "READING":
    case "WRITE":
      return step.guide
    case "COMPARE":
      return step.analysis
    case "FILL_BLANK":
    case "ORDER":
    case "SELECT":
      return step.explanation
    case "MULTIPLE_CHOICE":
      return "답을 선택하면 해설을 확인합니다."
  }
}

function renderStepContent(
  step: LessonStep,
  handlers: {
    readonly onAiFeedbackRequest: LessonStepRendererProps["onAiFeedbackRequest"]
    readonly onAnswerChange: LessonStepRendererProps["onAnswerChange"]
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
          onAnswerChange={handlers.onAnswerChange}
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
        <MatchAnswer onAnswerChange={handlers.onAnswerChange} step={step} />
      )
    case "MULTIPLE_CHOICE":
      return (
        <MultipleChoiceAnswer
          onAnswerChange={handlers.onAnswerChange}
          step={step}
        />
      )
    case "ORDER":
      return (
        <OrderAnswer onAnswerChange={handlers.onAnswerChange} step={step} />
      )
    case "READING":
      return (
        <div className="flex flex-col gap-3">
          <p className="leading-7">{step.body}</p>
          {step.source === undefined ? null : (
            <p className="text-sm text-muted-foreground">출처: {step.source}</p>
          )}
        </div>
      )
    case "SELECT":
      return (
        <SelectAnswer onAnswerChange={handlers.onAnswerChange} step={step} />
      )
    case "WRITE":
      return (
        <WriteAnswer onAnswerChange={handlers.onAnswerChange} step={step} />
      )
  }
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
  onAnswerChange,
  step,
}: {
  readonly onAnswerChange: LessonStepRendererProps["onAnswerChange"]
  readonly step: MultipleChoiceStep
}) {
  const [selectedOptionId, setSelectedOptionId] = useState<null | string>(null)
  const isCorrect = selectedOptionId === step.correct

  return (
    <div className="flex flex-col gap-3">
      {step.options.map((option) => (
        <Button
          className="h-auto justify-start text-left whitespace-normal"
          key={option.id}
          onClick={() => {
            setSelectedOptionId(option.id)
            emitAnswer(onAnswerChange, step.id, {
              selectedOptionId: option.id,
              type: "MULTIPLE_CHOICE",
            })
          }}
          variant={selectedOptionId === option.id ? "default" : "outline"}
        >
          {option.text}
        </Button>
      ))}
      {selectedOptionId === null ? null : (
        <div className="rounded-lg border border-border bg-muted px-4 py-3 text-sm">
          <p className="font-medium">
            {isCorrect ? "정답입니다." : "다시 생각해보세요."}
          </p>
          <p className="mt-1 text-muted-foreground">{step.explanation}</p>
        </div>
      )}
    </div>
  )
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
        <p className="text-sm text-muted-foreground">
          선택한 순서: {orderedItems.join(" → ")}
        </p>
      ) : null}
    </div>
  )
}

function MatchAnswer({
  onAnswerChange,
  step,
}: {
  readonly onAnswerChange: LessonStepRendererProps["onAnswerChange"]
  readonly step: MatchStep
}) {
  const [selectedPairs, setSelectedPairs] = useState<
    Readonly<Record<string, string>>
  >({})
  const rightOptions = step.pairs.map((pair) => pair.right)

  function handleMatch(left: string, right: string) {
    const nextPairs = {
      ...selectedPairs,
      [left]: right,
    }

    setSelectedPairs(nextPairs)
    emitAnswer(onAnswerChange, step.id, {
      pairs: step.pairs.flatMap((pair) => {
        const right = nextPairs[pair.left]

        return right === undefined
          ? []
          : [
              {
                left: pair.left,
                right,
              },
            ]
      }),
      type: "MATCH",
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {step.pairs.map((pair) => (
        <label
          className="grid gap-2 rounded-lg border border-border px-4 py-3 md:grid-cols-2"
          key={pair.left}
        >
          <span className="font-medium">{pair.left}</span>
          <select
            aria-label={`${pair.left} 연결`}
            className="rounded-lg border border-border bg-background px-3 py-2"
            onChange={(event) => handleMatch(pair.left, event.target.value)}
            value={selectedPairs[pair.left] ?? ""}
          >
            <option value="">선택</option>
            {rightOptions.map((rightOption) => (
              <option key={rightOption} value={rightOption}>
                {rightOption}
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>
  )
}

function CategorizeAnswer({
  onAnswerChange,
  step,
}: {
  readonly onAnswerChange: LessonStepRendererProps["onAnswerChange"]
  readonly step: CategorizeStep
}) {
  const [selectedCategories, setSelectedCategories] = useState<
    Readonly<Record<string, string>>
  >({})

  function handleCategorize(itemId: string, categoryId: string) {
    const nextCategories = {
      ...selectedCategories,
      [itemId]: categoryId,
    }

    setSelectedCategories(nextCategories)
    emitAnswer(onAnswerChange, step.id, {
      items: step.items.flatMap((item) => {
        const categoryId = nextCategories[item.id]

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
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {step.items.map((item) => (
        <label
          className="grid gap-2 rounded-lg border border-border px-4 py-3 md:grid-cols-[1fr_14rem]"
          key={item.id}
        >
          <span>{item.text}</span>
          <select
            aria-label={`${item.text} 분류`}
            className="rounded-lg border border-border bg-background px-3 py-2"
            onChange={(event) => handleCategorize(item.id, event.target.value)}
            value={selectedCategories[item.id] ?? ""}
          >
            <option value="">선택</option>
            {step.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>
  )
}

function WriteAnswer({
  onAnswerChange,
  step,
}: {
  readonly onAnswerChange: LessonStepRendererProps["onAnswerChange"]
  readonly step: WriteStep
}) {
  const [text, setText] = useState("")

  function handleChange(nextText: string) {
    setText(nextText)
    emitAnswer(onAnswerChange, step.id, {
      text: nextText,
      type: "WRITE",
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        최소 {step.min}자
        {step.goal === undefined ? "" : `, 목표 ${step.goal}자`}
        {step.max === undefined ? "" : `, 최대 ${step.max}자`}
      </p>
      <textarea
        aria-label="답변 입력"
        className="min-h-32 rounded-lg border border-border bg-background px-4 py-3 leading-7 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
        onChange={(event) => handleChange(event.target.value)}
        value={text}
      />
      {step.sample === undefined ? null : (
        <blockquote className="rounded-lg border border-border px-4 py-3 text-muted-foreground">
          {step.sample}
        </blockquote>
      )}
    </div>
  )
}

function emitAnswer(
  onAnswerChange: LessonStepRendererProps["onAnswerChange"],
  stepId: string,
  payload: LessonStepAnswerPayload
) {
  void onAnswerChange?.({
    answer: createLessonStepAnswer(payload),
    stepId,
  })
}
