import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

import { mergeAuthoringIntoSeed } from "#content/authoring/merge-authoring-into-seed"

describe("mergeAuthoringIntoSeed", () => {
  it("집필 레슨을 시드에 병합한다", async () => {
    const tempDir = mkdtempSync(join(tmpdir(), "merge-authoring-"))
    const seedPath = join(tempDir, "seed.json")
    const lessonsDirectory = join(tempDir, "lessons")
    mkdirSync(lessonsDirectory, { recursive: true })
    const lessonPath = join(lessonsDirectory, "lesson-a.json")

    writeFileSync(
      seedPath,
      JSON.stringify(
        [
          {
            cat: "test",
            desc: "desc",
            id: "course-a",
            title: "Course A",
            units: [
              {
                id: "unit-a",
                lessons: [
                  {
                    id: "lesson-a",
                    steps: [],
                    time: "5분",
                    title: "Lesson A",
                  },
                ],
                title: "Unit A",
              },
            ],
            visualKey: "book",
          },
        ],
        null,
        2
      )
    )
    writeFileSync(
      lessonPath,
      JSON.stringify(
        [
          {
            correct: true,
            explanation: "해설 문장입니다.",
            question: "맞는 문장은?",
            statement: "판정 문장 예시입니다.",
            type: "true_false",
          },
          {
            correct: false,
            explanation: "해설 문장입니다.",
            question: "맞는 문장은?",
            statement: "또 다른 판정 문장입니다.",
            type: "true_false",
          },
          {
            correct: "opt-a",
            explanation: "해설 문장입니다.",
            options: [
              { id: "opt-a", text: "첫째 선택" },
              { id: "opt-b", text: "둘째 선택" },
            ],
            question: "정답은 무엇인가요?",
            type: "multiple_choice",
          },
          {
            correct: "opt-b",
            explanation: "해설 문장입니다.",
            options: [
              { id: "opt-a", text: "첫째 선택" },
              { id: "opt-b", text: "둘째 선택" },
            ],
            question: "정답은 무엇인가요?",
            type: "multiple_choice",
          },
          {
            correct: "opt-a",
            explanation: "해설 문장입니다.",
            options: [
              { id: "opt-a", text: "첫째 선택" },
              { id: "opt-b", text: "둘째 선택" },
            ],
            question: "정답은 무엇인가요?",
            type: "multiple_choice",
          },
          {
            correct: "opt-b",
            explanation: "해설 문장입니다.",
            options: [
              { id: "opt-a", text: "첫째 선택" },
              { id: "opt-b", text: "둘째 선택" },
            ],
            question: "정답은 무엇인가요?",
            type: "multiple_choice",
          },
          {
            correct: "opt-a",
            explanation: "해설 문장입니다.",
            options: [
              { id: "opt-a", text: "첫째 선택" },
              { id: "opt-b", text: "둘째 선택" },
            ],
            question: "정답은 무엇인가요?",
            type: "multiple_choice",
          },
          {
            analysis: "로서는 자격, 로써는 수단입니다.",
            title: "두 문장 비교",
            type: "compare",
            versions: [
              { label: "자격", mark: "로서", text: "자격으로서 적합하다." },
              { label: "수단", mark: "로써", text: "수단으로써 해결했다." },
            ],
          },
        ],
        null,
        2
      )
    )

    const result = await mergeAuthoringIntoSeed({
      courseId: "course-a",
      lessonsDirectory,
      seedPath,
      validateAuthoring: false,
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return

    const seed = JSON.parse(readFileSync(seedPath, "utf8")) as Array<{
      units: Array<{ lessons: Array<{ steps: unknown[] }> }>
    }>
    expect(seed[0]?.units[0]?.lessons[0]?.steps).toHaveLength(8)
    expect(result.result.mergedLessonIds).toEqual(["lesson-a"])
  })
})
