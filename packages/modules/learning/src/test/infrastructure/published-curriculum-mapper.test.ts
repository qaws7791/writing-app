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

type PersistedUnit = PersistedPublishedCurriculum["units"][number]
type PersistedLesson = PersistedUnit["lessons"][number]
type PersistedStep = PersistedLesson["steps"][number]

const step: PersistedStep = {
  contentJson: JSON.stringify({
    body: "본문",
    guide: "읽기",
    title: "첫 단계",
    type: "READING",
  }),
  id: lessonStepIdSchema.parse("step-1"),
  sortOrder: 1,
  type: "READING",
}
const lesson: PersistedLesson = {
  category: "기초",
  description: "설명",
  estimatedMinutes: 5,
  id: lessonIdSchema.parse("lesson-1"),
  sortOrder: 1,
  status: "active",
  steps: [step],
  summary: ["요약"],
  title: "첫 레슨",
}
const unit: PersistedUnit = {
  id: unitIdSchema.parse("unit-1"),
  lessons: [lesson],
  sortOrder: 1,
  status: "active",
  title: "단원",
}
const curriculum: PersistedPublishedCurriculum = {
  category: "기초",
  courseId: courseIdSchema.parse("course-1"),
  coverAssetId: null,
  curriculumVersionId: curriculumVersionIdSchema.parse("curriculum-1"),
  description: "설명",
  revision: 1,
  title: "학습 코스",
  units: [unit],
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
    const invalid: PersistedPublishedCurriculum = {
      ...curriculum,
      units: [
        {
          ...unit,
          lessons: [
            {
              ...lesson,
              steps: [{ ...step, contentJson: "{invalid" }],
            },
          ],
        },
      ],
    }

    expect(() => mapPublishedLearningCurriculum(invalid, "active")).toThrow(
      "Published learning step JSON is invalid"
    )
  })
})
