import type { LessonStep } from "@/features/lessons/lesson-types"
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
}

export function LessonStepRenderer({
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
        <CardContent>{renderStepContent(step)}</CardContent>
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

function renderStepContent(step: LessonStep) {
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
      return (
        <div className="flex flex-col gap-3">
          {step.categories.map((category) => (
            <div
              className="rounded-lg border border-border px-4 py-3"
              key={category.id}
            >
              <p className="font-medium">{category.label}</p>
              <ul className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground">
                {step.items
                  .filter((item) => item.categoryId === category.id)
                  .map((item) => (
                    <li key={item.id}>{item.text}</li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
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
        <div className="flex flex-col gap-3">
          <p className="leading-7">{step.template}</p>
          <p className="text-sm text-muted-foreground">
            선택 단어: {step.words.join(", ")}
          </p>
        </div>
      )
    case "MATCH":
      return (
        <div className="flex flex-col gap-3">
          {step.pairs.map((pair) => (
            <div
              className="grid gap-2 rounded-lg border border-border px-4 py-3 md:grid-cols-2"
              key={`${pair.left}-${pair.right}`}
            >
              <p>{pair.left}</p>
              <p className="text-muted-foreground">{pair.right}</p>
            </div>
          ))}
        </div>
      )
    case "MULTIPLE_CHOICE":
      return (
        <ul className="flex flex-col gap-2">
          {step.options.map((option) => (
            <li
              className="rounded-lg border border-border px-4 py-3"
              key={option.id}
            >
              {option.text}
            </li>
          ))}
        </ul>
      )
    case "ORDER":
      return (
        <ol className="flex flex-col gap-2">
          {step.items.map((item) => (
            <li
              className="rounded-lg border border-border px-4 py-3"
              key={item}
            >
              {item}
            </li>
          ))}
        </ol>
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
        <div className="flex flex-wrap gap-2">
          {step.segments.map((segment) => (
            <span
              className="rounded-lg border border-border px-3 py-2 text-sm"
              key={segment}
            >
              {segment}
            </span>
          ))}
        </div>
      )
    case "WRITE":
      return (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            최소 {step.min}자
            {step.goal === undefined ? "" : `, 목표 ${step.goal}자`}
            {step.max === undefined ? "" : `, 최대 ${step.max}자`}
          </p>
          {step.sample === undefined ? null : (
            <blockquote className="rounded-lg border border-border px-4 py-3 text-muted-foreground">
              {step.sample}
            </blockquote>
          )}
        </div>
      )
  }
}
