import type { Lesson, LessonStep } from "@/features/lessons/lesson-types"
import type { ApiLessonResponse } from "@/lib/api/writing-app-api"

export function mapLesson(response: ApiLessonResponse): Lesson {
  return {
    category: response.category,
    courseId: response.courseId,
    description: response.description,
    estimatedMinutes: response.estimatedMinutes,
    id: response.id,
    steps: response.steps.map(mapLessonStep),
    summary: response.summary,
    title: response.title,
    unitId: response.unitId,
  }
}

function mapLessonStep(step: ApiLessonResponse["steps"][number]): LessonStep {
  const base = {
    id: step.id,
    order: step.sortOrder,
  }

  switch (step.type) {
    case "READING":
      return {
        ...base,
        body: step.body ?? "",
        guide: step.guide ?? "",
        source: step.source,
        title: step.title ?? "",
        type: step.type,
      }
    case "COMPARE":
      return {
        ...base,
        analysis: step.analysis ?? "",
        title: step.title ?? "",
        type: step.type,
        versions: step.versions ?? [],
      }
    case "MULTIPLE_CHOICE":
      return {
        ...base,
        correct: String(step.correct ?? ""),
        explanation: step.explanation ?? "",
        options: step.options ?? [],
        question: step.question ?? "",
        type: step.type,
        wrong: step.wrong,
      }
    case "FILL_BLANK":
      return {
        ...base,
        answer: step.answer ?? [],
        explanation: step.explanation ?? "",
        template: step.template ?? "",
        type: step.type,
        words: step.words ?? [],
      }
    case "SELECT":
      return {
        ...base,
        correct: toNumberArray(step.correct),
        explanation: step.explanation ?? "",
        layout: step.layout,
        question: step.question ?? "",
        segments: step.segments ?? [],
        type: step.type,
      }
    case "ORDER":
      return {
        ...base,
        correct: toStringArray(step.correct),
        explanation: step.explanation ?? "",
        items: toStringArray(step.items),
        showNumbers: step.showNumbers,
        title: step.title ?? "",
        type: step.type,
      }
    case "WRITE":
      return {
        ...base,
        badge: step.badge,
        claim: step.claim,
        context: step.context,
        draft: step.draft,
        goal: step.goal,
        guide: step.guide ?? "",
        max: step.max,
        min: step.min ?? 0,
        mode: step.mode,
        placeholder: step.placeholder,
        prompt: step.prompt,
        reference: step.reference,
        sample: step.sample,
        structure: step.structure,
        title: step.title,
        type: step.type,
      }
    case "AI_FEEDBACK":
      return {
        ...base,
        allowRetry: step.allowRetry ?? false,
        feedback: step.feedback ?? "",
        focus: step.focus ?? "",
        score: step.score ?? 0,
        scoreMax: step.scoreMax ?? 100,
        showScore: step.showScore ?? false,
        target: step.target ?? "",
        type: step.type,
      }
    case "MATCH":
      return {
        ...base,
        explanation: step.explanation ?? "",
        guide: step.guide ?? "",
        pairs: step.pairs ?? [],
        title: step.title ?? "",
        type: step.type,
      }
    case "CATEGORIZE":
      return {
        ...base,
        categories: step.categories ?? [],
        explanation: step.explanation ?? "",
        guide: step.guide ?? "",
        items: toCategorizeItems(step.items),
        title: step.title ?? "",
        type: step.type,
      }
  }
}

function toStringArray(value: unknown): readonly string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : []
}

function toNumberArray(value: unknown): readonly number[] {
  return Array.isArray(value)
    ? value.filter((item): item is number => typeof item === "number")
    : []
}

function toCategorizeItems(value: unknown): readonly {
  readonly categoryId: string
  readonly id: string
  readonly text: string
}[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter(
    (
      item
    ): item is {
      readonly categoryId: string
      readonly id: string
      readonly text: string
    } =>
      typeof item === "object" &&
      item !== null &&
      "categoryId" in item &&
      typeof item.categoryId === "string" &&
      "id" in item &&
      typeof item.id === "string" &&
      "text" in item &&
      typeof item.text === "string"
  )
}
