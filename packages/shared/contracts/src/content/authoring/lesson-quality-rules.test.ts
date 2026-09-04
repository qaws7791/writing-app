import { describe, expect, it } from "vitest"

import { collectLessonQualityIssues } from "#contracts/content/authoring/lesson-quality-rules"
import type { LessonStepDto } from "#contracts/content/course"
import { lessonStepIdSchema } from "#contracts/content/ids"

describe("collectLessonQualityIssues", () => {
  it("첫 스텝이 판정 스텝이면 거절한다", () => {
    const issues = collectLessonQualityIssues({
      lessonId: "lesson-1",
      steps: [createTrueFalse("팀장으로서 회의를 열었어요.")],
    })

    expect(issues.map((issue) => issue.message)).toContain(
      "첫 스텝은 COMPARE 또는 READING이어야 합니다."
    )
  })

  it("교정안에 원문이 들어가거나 두 개뿐이면 거절한다", () => {
    const issues = collectLessonQualityIssues({
      lessonId: "lesson-1",
      steps: [
        createCompare(),
        createErrorCorrect({
          fixes: ["으로써 마쳤어요.", "으로서 마쳤어요."],
          segments: ["설문 ", "으로서 마쳤어요."],
        }),
      ],
    })

    const messages = issues.map((issue) => issue.message)
    expect(messages).toContain("ERROR_CORRECT 교정안은 3개 이상이어야 합니다.")
    expect(messages).toContain("교정안에 원문 구간을 그대로 넣을 수 없습니다.")
  })

  it("위치 정답이 마지막 구간에 몰리면 거절한다", () => {
    const lastCorrect = createErrorCorrect({
      fixes: ["바른 안", "오진 안 하나", "오진 안 둘"],
      segments: ["첫 구간 ", "둘째 구간 ", "틀린 구간"],
    })
    const issues = collectLessonQualityIssues({
      lessonId: "lesson-1",
      steps: [createCompare(), lastCorrect, lastCorrect, lastCorrect],
    })

    expect(
      issues.some((issue) => issue.message.includes("마지막 구간에 100%"))
    ).toBe(true)
  })

  it("합니다체 해설을 거절하고 인용 속 종결은 허용한다", () => {
    const formal = collectLessonQualityIssues({
      lessonId: "lesson-1",
      steps: [
        createCompare(),
        createTrueFalse("문장", "자격이므로 '로서'가 맞습니다."),
      ],
    })
    const quoted = collectLessonQualityIssues({
      lessonId: "lesson-1",
      steps: [
        createCompare(),
        createTrueFalse("문장", "'제출했습니다'처럼 자격이라 '로서'를 써요."),
      ],
    })

    expect(formal.some((issue) => issue.message.includes("해요체"))).toBe(true)
    expect(quoted.some((issue) => issue.message.includes("해요체"))).toBe(false)
  })

  it("브랜드 이름을 거절한다", () => {
    const issues = collectLessonQualityIssues({
      lessonId: "lesson-1",
      steps: [createCompare(), createTrueFalse("슬랙에 올린 공지예요.")],
    })

    expect(issues.some((issue) => issue.message.includes("슬랙"))).toBe(true)
  })
})

function createCompare(): LessonStepDto {
  return {
    analysis: "자격이면 로서, 수단이면 로써를 써요.",
    id: lessonStepIdSchema.parse("step-cp"),
    sortOrder: 1,
    title: "두 판본 비교",
    type: "COMPARE",
    versions: [
      { label: "자격", mark: "담당자로서", text: "담당자로서 정리했어요." },
      { label: "수단", mark: "설문으로써", text: "설문으로써 분석했어요." },
    ],
  }
}

function createTrueFalse(
  statement: string,
  explanation = "담당자는 자격이라 '로서'를 써요."
): LessonStepDto {
  return {
    correct: true,
    explanation,
    id: lessonStepIdSchema.parse("step-tf"),
    question: "그대로 올려도 되나요?",
    sortOrder: 1,
    statement,
    type: "TRUE_FALSE",
  }
}

function createErrorCorrect(input: {
  readonly fixes: readonly string[]
  readonly segments: readonly string[]
}): LessonStepDto {
  return {
    correctFix: "fix-1",
    correctSegment: `seg-${input.segments.length}`,
    explanation: "재료라서 '로써'를 써요.",
    fixIds: input.fixes.map((_, index) => `fix-${index + 1}`),
    fixes: [...input.fixes],
    id: lessonStepIdSchema.parse("step-ec"),
    question: "어긋난 자리를 고쳐요.",
    segmentIds: input.segments.map((_, index) => `seg-${index + 1}`),
    segments: [...input.segments],
    sortOrder: 1,
    type: "ERROR_CORRECT",
  }
}
