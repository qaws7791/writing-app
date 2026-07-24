import { describe, expect, it } from "vitest"

import {
  courseIdSchema,
  curriculumVersionIdSchema,
  lessonIdSchema,
  lessonStepIdSchema,
  unitIdSchema,
} from "@workspace/contracts/content/ids"

import {
  mapPublishedLearningCurriculum,
  type PersistedPublishedCurriculum,
} from "#learning/infrastructure/persistence/published-curriculum-mapper"

const curriculum: PersistedPublishedCurriculum = {
  category: "기초",
  courseId: courseIdSchema.parse("course-1"),
  coverAssetId: null,
  curriculumVersionId: curriculumVersionIdSchema.parse("curriculum-1"),
  description: "설명",
  revision: 1,
  title: "학습 코스",
  units: [
    {
      id: unitIdSchema.parse("unit-1"),
      lessons: [
        {
          category: "기초",
          description: "설명",
          estimatedMinutes: 5,
          id: lessonIdSchema.parse("lesson-1"),
          sortOrder: 1,
          status: "active",
          steps: [
            {
              contentJson: JSON.stringify({
                body: "본문",
                guide: "읽기",
                title: "첫 단계",
                type: "READING",
              }),
              id: lessonStepIdSchema.parse("step-1"),
              sortOrder: 1,
              type: "READING",
            },
          ],
          summary: ["요약"],
          title: "첫 레슨",
        },
      ],
      sortOrder: 1,
      status: "active",
      title: "단원",
    },
  ],
  visualKey: "basic-sentence-writing",
}

describe("published curriculum persistence mapper", () => {
  it("persisted JSON을 공개 learning curriculum으로 복원한다", () => {
    const mapped = mapPublishedLearningCurriculum(curriculum, "active")

    expect(mapped).toMatchObject({
      contentStatus: "active",
      courseId: "course-1",
      lessons: [{ id: "lesson-1", steps: [{ id: "step-1" }] }],
    })
  })

  it("손상된 persisted JSON을 fail-closed한다", () => {
    const invalid = {
      ...curriculum,
      units: [
        {
          ...curriculum.units[0],
          lessons: [
            {
              ...curriculum.units[0]?.lessons[0],
              steps: [
                {
                  ...curriculum.units[0]?.lessons[0]?.steps[0],
                  contentJson: "{invalid",
                },
              ],
            },
          ],
        },
      ],
    } as PersistedPublishedCurriculum

    expect(() => mapPublishedLearningCurriculum(invalid, "active")).toThrow(
      "Published learning step JSON is invalid"
    )
  })
})
