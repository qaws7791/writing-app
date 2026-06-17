import { describe, expect, it } from "vitest"

import {
  createContentSeedRows,
  toStandardLessonStepType,
  type KwepCourseSeed,
  type StandardLessonStepType,
} from "@/seeds/seed-content"

async function readSeedData(): Promise<readonly KwepCourseSeed[]> {
  const seedUrl = new URL("./content-seed-data.json", import.meta.url)

  return (await Bun.file(seedUrl).json()) as readonly KwepCourseSeed[]
}

describe("Kwep 콘텐츠 seed 변환", () => {
  it("Kwep 원본 콘텐츠를 새 baseline row 수량으로 변환한다", async () => {
    const rows = createContentSeedRows(await readSeedData())

    expect(rows.courses).toHaveLength(5)
    expect(rows.units).toHaveLength(15)
    expect(rows.lessons).toHaveLength(44)
    expect(rows.steps).toHaveLength(136)

    expect(rows.courses[0]).toMatchObject({
      id: "c1",
      title: "글쓰기 첫걸음 30일",
      description:
        "문장의 기본부터 한 문단을 완성하기까지, 매일 조금씩 쓰는 습관을 만듭니다.",
      category: "입문자를 위한 코스",
      visualKey: "basic-sentence-writing",
      status: "active",
      sortOrder: 1,
      curriculumRevision: 0,
    })

    expect(rows.units[0]).toMatchObject({
      id: "u1",
      courseId: "c1",
      title: "문장의 기본기",
      status: "active",
      sortOrder: 1,
    })

    expect(rows.lessons[0]).toMatchObject({
      id: "l1",
      courseId: "c1",
      unitId: "u1",
      title: "좋은 문장이란 무엇인가",
      category: "문장의 기본기",
      description: "명료하고 군더더기 없는 문장을 살펴봅니다.",
      estimatedMinutes: 5,
      summaryJson: JSON.stringify([
        "좋은 문장은 모호하지 않다",
        "한 문장에는 한 가지 생각만 담는다",
      ]),
      status: "active",
      sortOrder: 1,
    })

    expect(rows.steps[0]).toMatchObject({
      id: "l1-s1",
      lessonId: "l1",
      type: "READING",
      status: "active",
      sortOrder: 1,
    })
    expect(JSON.parse(rows.steps[0]?.contentJson ?? "{}")).toMatchObject({
      type: "reading",
      title: "명료성의 원칙",
    })
  })

  it("Kwep 스텝 타입을 저장용 표준 타입으로 정규화한다", () => {
    expect(toStandardLessonStepType("reading")).toBe("READING")
    expect(toStandardLessonStepType("multiple_choice")).toBe("MULTIPLE_CHOICE")
    expect(toStandardLessonStepType("ai_feedback")).toBe("AI_FEEDBACK")
    expect(toStandardLessonStepType("categorize")).toBe("CATEGORIZE")
  })

  it("Kwep 스텝 타입 분포를 보존한다", async () => {
    const rows = createContentSeedRows(await readSeedData())
    const distribution = rows.steps.reduce(
      (counts, step) => ({
        ...counts,
        [step.type]: counts[step.type] + 1,
      }),
      {
        AI_FEEDBACK: 0,
        CATEGORIZE: 0,
        COMPARE: 0,
        FILL_BLANK: 0,
        MATCH: 0,
        MULTIPLE_CHOICE: 0,
        ORDER: 0,
        READING: 0,
        SELECT: 0,
        WRITE: 0,
      } satisfies Record<StandardLessonStepType, number>
    )

    expect(distribution).toEqual({
      AI_FEEDBACK: 2,
      CATEGORIZE: 1,
      COMPARE: 8,
      FILL_BLANK: 5,
      MATCH: 1,
      MULTIPLE_CHOICE: 12,
      ORDER: 3,
      READING: 62,
      SELECT: 2,
      WRITE: 40,
    })
  })
})
