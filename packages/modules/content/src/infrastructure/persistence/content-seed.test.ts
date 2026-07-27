import { describe, expect, it } from "vitest"
import { lessonStepDtoSchema } from "@workspace/contracts/content/course"

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
} from "#content/infrastructure/persistence/content-seed"

async function readSeedData(): Promise<readonly ContentSeedCourse[]> {
  const seedUrl = new URL("./content-seed-data.json", import.meta.url)

  return (await Bun.file(seedUrl).json()) as readonly ContentSeedCourse[]
}

describe("기준 콘텐츠 seed 변환", () => {
  it("기준 콘텐츠를 새 baseline row 수량으로 변환한다", async () => {
    const rows = createContentSeedRows(await readSeedData())

    expect(rows.courses).toHaveLength(14)
    expect(rows.units).toHaveLength(69)
    expect(rows.lessons).toHaveLength(321)
    expect(rows.steps).toHaveLength(831)

    expect(rows.courses[0]).toMatchObject({
      id: "course-word-sentence-meaning",
      title: "어휘와 문장의 의미 정확히 읽기",
      description:
        "문맥, 문장 구조, 지시와 논리 관계를 함께 살펴 단어와 문장의 가능한 의미를 구별합니다.",
      category: "언어와 읽기",
      visualKey: "basic-sentence-writing",
      status: "active",
      sortOrder: 1,
    })

    expect(rows.units[0]).toMatchObject({
      id: "unit-word-context-and-use",
      courseId: "course-word-sentence-meaning",
      title: "문맥에서 단어 의미와 쓰임 판단하기",
      status: "active",
      sortOrder: 1,
    })

    expect(rows.lessons[0]).toMatchObject({
      id: "lesson-word-context-clues",
      courseId: "course-word-sentence-meaning",
      unitId: "unit-word-context-and-use",
      title: "문맥 단서의 종류 찾기",
      category: "문맥에서 단어 의미와 쓰임 판단하기",
      description:
        "같은 단어 주변의 대상·행동·상황 단서를 표시하고 각 단서가 배제하는 뜻을 말한다.",
      estimatedMinutes: 8,
      summaryJson: JSON.stringify([
        "문맥 단서의 종류 찾기에서는 판단 대상과 적용 범위를 먼저 고정한다.",
        "직접 확인한 근거와 해석, 남은 한계를 구분한다.",
        "근거가 지지하는 범위에서 결론을 제시하고 다시 검토한다.",
      ]),
      status: "active",
      sortOrder: 1,
    })

    expect(rows.steps[0]).toMatchObject({
      id: "lesson-word-context-clues-s1",
      lessonId: "lesson-word-context-clues",
      type: "READING",
      status: "active",
      sortOrder: 1,
    })
    expect(JSON.parse(rows.steps[0]?.contentJson ?? "{}")).toMatchObject({
      type: "reading",
      title: "문맥 단서의 종류 찾기의 판단 기준",
    })

    expect(
      rows.steps
        .filter((step) => step.type === "AI_FEEDBACK")
        .map((step) => JSON.parse(step.contentJson).target)
    ).toEqual([
      "lesson-expression-independent-edit-s3",
      "lesson-argument-independent-s3",
      "lesson-revision-new-task-s3",
    ])
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

  it.each([
    {
      name: "같은 레슨에 없는 target",
      steps: [
        { type: "write" as const },
        { target: "missing", type: "ai_feedback" as const },
      ],
    },
    {
      name: "WRITE가 아닌 target",
      steps: [
        { type: "reading" as const },
        { target: "lesson-a-s1", type: "ai_feedback" as const },
      ],
    },
    {
      name: "AI 스텝보다 뒤에 있는 target",
      steps: [
        { target: "lesson-a-s2", type: "ai_feedback" as const },
        { type: "write" as const },
      ],
    },
  ])("AI 코칭의 $name을 거절한다", ({ steps }) => {
    expect(() =>
      toLessonStepSeedRows({
        id: "lesson-a",
        steps,
        time: "5분",
        title: "레슨",
      })
    ).toThrow("Invalid AI feedback target")
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
      AI_FEEDBACK: 3,
      CATEGORIZE: 87,
      COMPARE: 38,
      FILL_BLANK: 4,
      MATCH: 60,
      MULTIPLE_CHOICE: 50,
      ORDER: 22,
      READING: 321,
      SELECT: 60,
      WRITE: 186,
    })

    for (const step of rows.steps) {
      const { type: _seedType, ...content } = JSON.parse(step.contentJson) as {
        readonly type?: unknown
        readonly [field: string]: unknown
      }
      expect(
        lessonStepDtoSchema.safeParse({
          ...content,
          id: step.id,
          sortOrder: step.sortOrder,
          type: step.type,
        }).success
      ).toBe(true)
    }
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
