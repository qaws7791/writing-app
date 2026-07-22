import { createHmac } from "node:crypto"

import type { LearnerLessonStep } from "#learning/application/learning-read-model"
import type { LearningStep } from "#learning/domain/learning-types"

export type LearnerStepPresentationContext = {
  readonly learnerScope: string
  readonly lessonId: string
  readonly versionId: string
}

/**
 * 내부 학습 단계를 학습자 공개 허용 목록으로 투영한다.
 * 각 variant는 중첩 값까지 공개 필드만 새 객체로 구성한다.
 */
export function presentLearnerStep(
  step: LearningStep,
  context: LearnerStepPresentationContext
): LearnerLessonStep {
  const order = <T extends { readonly id: string }>(items: readonly T[]) =>
    orderLearnerStepItems(items, createPresentationScope(step, context))

  switch (step.type) {
    case "READING":
      return {
        body: step.body,
        guide: step.guide,
        id: step.id,
        sortOrder: step.sortOrder,
        source: step.source,
        title: step.title,
        type: "READING",
      }
    case "COMPARE":
      return {
        id: step.id,
        sortOrder: step.sortOrder,
        title: step.title,
        type: "COMPARE",
        versions: step.versions.map((version) => ({
          label: version.label,
          text: version.text,
        })),
      }
    case "MULTIPLE_CHOICE":
      return {
        id: step.id,
        options: order(
          step.options.map((option) => ({
            id: option.id,
            text: option.text,
          }))
        ),
        question: step.question,
        sortOrder: step.sortOrder,
        type: "MULTIPLE_CHOICE",
      }
    case "FILL_BLANK":
      return {
        blankCount: step.answer.length,
        choices: order(
          step.words.map((text, index) => ({
            id: requireItemId(step.wordIds?.[index], step.id, "word", index),
            text,
          }))
        ),
        id: step.id,
        sortOrder: step.sortOrder,
        template: step.template,
        type: "FILL_BLANK",
      }
    case "SELECT":
      return {
        id: step.id,
        items: step.segments.map((text, index) => ({
          id: requireItemId(
            step.segmentIds?.[index],
            step.id,
            "segment",
            index
          ),
          text,
        })),
        layout: step.layout,
        question: step.question,
        sortOrder: step.sortOrder,
        type: "SELECT",
      }
    case "ORDER":
      return {
        id: step.id,
        items: order(
          step.items.map((text, index) => ({
            id: requireItemId(step.itemIds?.[index], step.id, "item", index),
            text,
          }))
        ),
        showNumbers: step.showNumbers,
        sortOrder: step.sortOrder,
        title: step.title,
        type: "ORDER",
      }
    case "WRITE":
      return {
        badge: step.badge,
        claim: step.claim,
        context: step.context,
        draft: step.draft,
        goal: step.goal,
        guide: step.guide,
        id: step.id,
        max: step.max,
        min: step.min,
        mode: step.mode,
        placeholder: step.placeholder,
        prompt: step.prompt,
        reference: step.reference,
        sample: step.sample,
        sortOrder: step.sortOrder,
        structure: step.structure,
        title: step.title,
        topic: step.topic,
        type: "WRITE",
      }
    case "AI_FEEDBACK":
      return {
        focus: step.focus,
        id: step.id,
        sortOrder: step.sortOrder,
        target: step.target,
        type: "AI_FEEDBACK",
      }
    case "MATCH":
      return {
        guide: step.guide,
        id: step.id,
        leftItems: order(
          step.pairs.map((pair, index) => ({
            id: requireItemId(pair.leftId, step.id, "left", index),
            text: pair.left,
          }))
        ),
        rightItems: order(
          step.pairs.map((pair, index) => ({
            id: requireItemId(pair.rightId, step.id, "right", index),
            text: pair.right,
          }))
        ),
        sortOrder: step.sortOrder,
        title: step.title,
        type: "MATCH",
      }
    case "CATEGORIZE":
      return {
        categories: order(
          step.categories.map((category) => ({
            id: category.id,
            text: category.label,
          }))
        ),
        guide: step.guide,
        id: step.id,
        items: order(
          step.items.map((item) => ({
            id: item.id,
            text: item.text,
          }))
        ),
        sortOrder: step.sortOrder,
        title: step.title,
        type: "CATEGORIZE",
      }
  }

  return assertNever(step)
}

function createPresentationScope(
  step: LearningStep,
  context: LearnerStepPresentationContext
): string {
  return `${context.learnerScope}:${context.versionId}:${context.lessonId}:${step.id}`
}

function orderLearnerStepItems<T extends { readonly id: string }>(
  items: readonly T[],
  scope: string
): readonly T[] {
  return Array.from(items).sort((left, right) => {
    const leftKey = createHmac("sha256", scope).update(left.id).digest("hex")
    const rightKey = createHmac("sha256", scope).update(right.id).digest("hex")
    return leftKey.localeCompare(rightKey) || left.id.localeCompare(right.id)
  })
}

function requireItemId(
  value: string | undefined,
  stepId: string,
  kind: string,
  index: number
): string {
  if (value === undefined || value.length === 0) {
    throw new Error(`Missing stable ${kind} ID for ${stepId} at ${index}`)
  }
  return value
}

function assertNever(value: never): never {
  throw new Error(`Unsupported learner step: ${String(value)}`)
}
