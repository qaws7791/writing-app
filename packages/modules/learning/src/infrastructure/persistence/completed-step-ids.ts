import {
  lessonStepIdSchema,
  type LessonStepId,
} from "@workspace/contracts/content/ids"

export function serializeCompletedStepIds(
  stepIds: readonly LessonStepId[]
): string {
  return JSON.stringify(stepIds)
}

export function parseCompletedStepIds(
  raw: string,
  validStepIds: ReadonlySet<string>
): readonly LessonStepId[] {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    const unique = new Set<LessonStepId>()
    for (const value of parsed) {
      if (typeof value !== "string" || !validStepIds.has(value)) continue
      unique.add(lessonStepIdSchema.parse(value))
    }
    return [...unique]
  } catch {
    return []
  }
}

export function mergeCompletedStepIds(
  stored: readonly LessonStepId[],
  incoming: readonly LessonStepId[],
  orderedStepIds: readonly LessonStepId[]
): readonly LessonStepId[] {
  const completed = new Set<string>([...stored, ...incoming])
  return orderedStepIds.filter((stepId) => completed.has(stepId))
}

export function inProgressLearningProjection(input: {
  readonly completedStepIds: readonly LessonStepId[]
  readonly currentStepId: LessonStepId
  readonly orderedStepIds: readonly LessonStepId[]
}): {
  readonly completedStepIds: readonly LessonStepId[]
  readonly completedSteps: number
  readonly currentStepId: LessonStepId
  readonly currentStepIndex: number
  readonly progressPercent: number
} {
  const completedStepIds = input.orderedStepIds.filter((stepId) =>
    input.completedStepIds.includes(stepId)
  )
  const currentStepIndex = Math.max(
    0,
    input.orderedStepIds.findIndex((stepId) => stepId === input.currentStepId)
  )
  const totalSteps = input.orderedStepIds.length
  return {
    completedStepIds,
    completedSteps: completedStepIds.length,
    currentStepId: input.currentStepId,
    currentStepIndex,
    progressPercent:
      totalSteps === 0
        ? 0
        : Math.round((completedStepIds.length / totalSteps) * 100),
  }
}
