import { describe, expect, it } from "vitest"
import { lessonStepDtoSchema } from "@workspace/contracts/content/course"

import {
  createContentSeedRows,
  toCourseSeedRow,
  toLessonSeedRows,
  toLessonStepSeedRows,
  toStepSeedRows,
  toUnitSeedRows,
  type ContentSeedCourse,
  type ContentSeedRows,
} from "#content/infrastructure/persistence/content-seed"

async function readSeedData(): Promise<readonly ContentSeedCourse[]> {
  const seedUrl = new URL("./content-seed-data.json", import.meta.url)

  return (await Bun.file(seedUrl).json()) as readonly ContentSeedCourse[]
}

describe("기준 콘텐츠 seed 변환", () => {
  it("변환한 모든 step은 학습자 계약 schema를 만족한다", async () => {
    const rows = createContentSeedRows(await readSeedData())

    expect(readStepContractViolations(rows)).toEqual([])
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
})

function readStepContractViolations(rows: ContentSeedRows): readonly string[] {
  return rows.steps.flatMap((step) => {
    const { type: _seedType, ...content } = JSON.parse(step.contentJson) as {
      readonly type?: unknown
      readonly [field: string]: unknown
    }
    const parsed = lessonStepDtoSchema.safeParse({
      ...content,
      id: step.id,
      sortOrder: step.sortOrder,
      type: step.type,
    })

    return parsed.success
      ? []
      : [`${step.id}: ${JSON.stringify(parsed.error.issues)}`]
  })
}

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
