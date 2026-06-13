"use client"

import { useState } from "react"

import {
  createLessonStepAnswer,
  type LessonAnswerChange,
  type LessonStepAnswerPayload,
} from "@/features/lessons/lesson-logic"
import type {
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
  readonly onAnswerChange?: (change: LessonAnswerChange) => Promise<void> | void
}

export function LessonStepRenderer({
  answerError,
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
          {renderStepContent(step, onAnswerChange)}
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
    case "MULTIPLE_CHOICE":
    case "ORDER":
    case "SELECT":
      return step.explanation
  }
}

function renderStepContent(
  step: LessonStep,
  onAnswerChange: LessonStepRendererProps["onAnswerChange"]
) {
  switch (step.type) {
    case "AI_FEEDBACK":
      return (
        <div className="flex flex-col gap-3">
          <p className="leading-7">{step.feedback}</p>
          {step.showScore ? (
            <p className="text-sm text-muted-foreground">
              {step.score}/{step.scoreMax}점
            </p>
          ) : null}
        </div>
      )
    case "CATEGORIZE":
      return <CategorizeAnswer step={step} onAnswerChange={onAnswerChange} />
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
      return <FillBlankAnswer step={step} onAnswerChange={onAnswerChange} />
    case "MATCH":
      return <MatchAnswer step={step} onAnswerChange={onAnswerChange} />
    case "MULTIPLE_CHOICE":
      return (
        <MultipleChoiceAnswer step={step} onAnswerChange={onAnswerChange} />
      )
    case "ORDER":
      return <OrderAnswer step={step} onAnswerChange={onAnswerChange} />
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
      return <SelectAnswer step={step} onAnswerChange={onAnswerChange} />
    case "WRITE":
      return <WriteAnswer step={step} onAnswerChange={onAnswerChange} />
  }
}

function MultipleChoiceAnswer({
  onAnswerChange,
  step,
}: {
  readonly onAnswerChange: LessonStepRendererProps["onAnswerChange"]
  readonly step: MultipleChoiceStep
}) {
  return (
    <div className="flex flex-col gap-2">
      {step.options.map((option) => (
        <Button
          className="h-auto justify-start text-left whitespace-normal"
          key={option.id}
          onClick={() =>
            emitAnswer(onAnswerChange, step.id, {
              selectedOptionId: option.id,
              type: "MULTIPLE_CHOICE",
            })
          }
          variant="outline"
        >
          {option.text}
        </Button>
      ))}
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
