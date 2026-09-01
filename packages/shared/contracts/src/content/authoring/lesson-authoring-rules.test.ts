import { describe, expect, it } from "vitest"

import { collectLessonAuthoringIssues } from "#contracts/content/authoring/lesson-authoring-rules"
import type { LessonStepDto } from "#contracts/content/course"
import { lessonStepIdSchema } from "#contracts/content/ids"

describe("collectLessonAuthoringIssues", () => {
  it("마지막 MULTIPLE_CHOICE를 거절한다", () => {
    const issues = collectLessonAuthoringIssues({
      lessonId: "lesson-1",
      steps: Array.from({ length: 8 }, (_, index) =>
        index === 7 ? createMultipleChoice() : createTrueFalse()
      ),
    })

    expect(issues.some((issue) => issue.message.includes("마지막"))).toBe(true)
  })

  it("중간 READING을 거절한다", () => {
    const issues = collectLessonAuthoringIssues({
      lessonId: "lesson-1",
      steps: [
        createTrueFalse(),
        createReading(),
        ...Array.from({ length: 6 }, () => createTrueFalse()),
      ],
    })

    expect(issues.some((issue) => issue.message.includes("첫 스텝"))).toBe(true)
  })
})

function createMultipleChoice(): LessonStepDto {
  return {
    correct: "opt-a",
    explanation: "해설 문장입니다.",
    id: lessonStepIdSchema.parse("step-mc"),
    options: [
      { id: "opt-a", text: "첫째 선택" },
      { id: "opt-b", text: "둘째 선택" },
    ],
    question: "정답은 무엇인가요?",
    sortOrder: 1,
    type: "MULTIPLE_CHOICE",
  }
}

function createTrueFalse(): LessonStepDto {
  return {
    correct: true,
    explanation: "해설 문장입니다.",
    id: lessonStepIdSchema.parse("step-tf"),
    question: "맞는 문장은?",
    sortOrder: 1,
    statement: "판정 문장 예시입니다.",
    type: "TRUE_FALSE",
  }
}

function createReading(): LessonStepDto {
  return {
    body: "로서는 자격, 로써는 수단입니다. 헷갈리면 문맥에서 역할을 먼저 보세요.",
    guide: "",
    id: lessonStepIdSchema.parse("step-rd"),
    sortOrder: 1,
    title: "로서와 로써",
    type: "READING",
  }
}
