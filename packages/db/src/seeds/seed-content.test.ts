import { describe, expect, it } from "vitest"

import {
  createContentSeedRows,
  normalizeSeedStepContent,
  toCourseSeedRow,
  toLessonSeedRows,
  toLessonStepSeedRows,
  toStepSeedRows,
  toStandardLessonStepType,
  toUnitSeedRows,
  type ContentSeedCourse,
  type StandardLessonStepType,
} from "@/seeds/seed-content"

async function readSeedData(): Promise<readonly ContentSeedCourse[]> {
  const seedUrl = new URL("./content-seed-data.json", import.meta.url)

  return (await Bun.file(seedUrl).json()) as readonly ContentSeedCourse[]
}

describe("기준 콘텐츠 seed 변환", () => {
  it("기준 콘텐츠를 새 baseline row 수량으로 변환한다", async () => {
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

  it("표준 스텝 타입을 저장용 표준 타입으로 정규화한다", () => {
    expect(toStandardLessonStepType("reading")).toBe("READING")
    expect(toStandardLessonStepType("multiple_choice")).toBe("MULTIPLE_CHOICE")
    expect(toStandardLessonStepType("ai_feedback")).toBe("AI_FEEDBACK")
    expect(toStandardLessonStepType("categorize")).toBe("CATEGORIZE")
  })

  it("계층별 row mapper가 parent id와 정렬 순서를 명시적으로 보존한다", () => {
    const course = createCourseSeed()

    expect(toCourseSeedRow(course, 1)).toMatchObject({
      id: "course-a",
      sortOrder: 2,
      status: "active",
    })
    expect(toUnitSeedRows(course)).toEqual([
      {
        courseId: "course-a",
        id: "unit-a",
        sortOrder: 1,
        status: "active",
        title: "첫 유닛",
      },
    ])
    expect(toLessonSeedRows(course)).toEqual([
      {
        category: "문장",
        courseId: "course-a",
        description: "설명",
        estimatedMinutes: 7,
        id: "lesson-a",
        sortOrder: 1,
        status: "active",
        summaryJson: JSON.stringify(["요약"]),
        title: "첫 레슨",
        unitId: "unit-a",
      },
    ])
    expect(toStepSeedRows(course)).toEqual([
      {
        contentJson: JSON.stringify({ type: "reading" }),
        id: "lesson-a-s1",
        lessonId: "lesson-a",
        sortOrder: 1,
        status: "active",
        type: "READING",
      },
      {
        contentJson: JSON.stringify({ type: "write" }),
        id: "lesson-a-s2",
        lessonId: "lesson-a",
        sortOrder: 2,
        status: "active",
        type: "WRITE",
      },
    ])
  })

  it("lesson step mapper와 content 정규화 정책을 독립적으로 검증한다", () => {
    const lesson = createCourseSeed().units[0]?.lessons[0]

    if (lesson === undefined) {
      throw new Error("테스트 lesson fixture가 없습니다.")
    }

    expect(toLessonStepSeedRows(lesson)).toHaveLength(2)
    expect(normalizeSeedStepContent({ type: "match" })).toBe(
      JSON.stringify({ type: "match" })
    )
  })

  it("잘못된 lesson time은 lesson row 변환 위치에서 명시적으로 거절한다", () => {
    expect(() =>
      toLessonSeedRows({
        ...createCourseSeed(),
        units: [
          {
            id: "unit-a",
            lessons: [
              {
                id: "lesson-a",
                steps: [],
                time: "곧",
                title: "잘못된 레슨",
              },
            ],
            title: "첫 유닛",
          },
        ],
      })
    ).toThrow("Invalid lesson time")
  })

  it("표준 스텝 타입 분포를 보존한다", async () => {
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

function createCourseSeed(): ContentSeedCourse {
  return {
    cat: "입문",
    desc: "코스 설명",
    id: "course-a",
    title: "첫 코스",
    units: [
      {
        id: "unit-a",
        lessons: [
          {
            cat: "문장",
            desc: "설명",
            id: "lesson-a",
            steps: [{ type: "reading" }, { type: "write" }],
            summary: ["요약"],
            time: "7분",
            title: "첫 레슨",
          },
        ],
        title: "첫 유닛",
      },
    ],
    visualKey: "basic-sentence-writing",
  }
}
