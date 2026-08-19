import type { LessonStepType } from "@workspace/contracts/content/steps"

import type { LessonStep } from "@/features/lesson-session/model/lesson-view-model"

export const LESSON_STEP_ACTIVITY_LABELS: Record<LessonStepType, string> = {
  CATEGORIZE: "분류하기",
  COMPARE: "비교하기",
  FILL_BLANK: "빈칸 채우기",
  MATCH: "짝 맞추기",
  MULTIPLE_CHOICE: "객관식",
  ORDER: "순서 맞추기",
  READING: "읽기",
  SELECT: "구간 선택",
}

export function listLessonActivityKindLabels(
  steps: readonly Pick<LessonStep, "type">[]
): readonly string[] {
  const seen = new Set<LessonStepType>()
  const labels: string[] = []

  for (const step of steps) {
    if (seen.has(step.type)) continue
    seen.add(step.type)
    labels.push(LESSON_STEP_ACTIVITY_LABELS[step.type])
  }

  return labels
}
