import type { LessonAuthoringIssue } from "#contracts/content/authoring/authoring-issue"

/** 유닛 안에서 두 레슨이 같은 스텝 유형 배열을 쓰면 학습 리듬이 반복되므로 막는다. */
export function collectUnitAuthoringIssues(input: {
  readonly lessons: readonly {
    readonly lessonId: string
    readonly stepTypes: readonly string[]
  }[]
  readonly unitId: string
}): readonly LessonAuthoringIssue[] {
  const issues: LessonAuthoringIssue[] = []
  const seen = new Map<string, string>()

  for (const lesson of input.lessons) {
    if (lesson.stepTypes.length === 0) continue
    const signature = lesson.stepTypes.join(",")
    const earlier = seen.get(signature)
    if (earlier !== undefined) {
      issues.push({
        message: `${earlier}와(과) 스텝 유형 배열이 같습니다. 같은 유닛에서 배치를 반복할 수 없습니다.`,
        path: `${input.unitId}/${lesson.lessonId}`,
        severity: "error",
      })
      continue
    }
    seen.set(signature, lesson.lessonId)
  }

  return issues
}
