import { describe, expect, it } from "vitest"

import { lessonStepDtoSchema } from "@workspace/contracts/content/course"
import {
  courseIdSchema,
  lessonIdSchema,
} from "@workspace/contracts/content/ids"
import {
  curriculumVersionIdSchema,
  learnerIdSchema,
  learnerStepSubmissionSchema,
} from "@workspace/contracts/learning/step-data"

import {
  planCompleteStep,
  type CompleteStepSnapshot,
} from "#core/modules/learning/domain/complete-step-effect-plan"
import type {
  CompleteLearnerStepCommand,
  LearnerStepCompletion,
} from "#core/modules/learning/domain/learner-transition"

const occurredAt = new Date("2026-07-17T09:00:00.000Z")
const courseId = courseIdSchema.parse("course-1")
const lessonId = lessonIdSchema.parse("lesson-1")
const nextLessonId = lessonIdSchema.parse("lesson-2")
const userId = learnerIdSchema.parse("learner-1")
const curriculumVersionId = curriculumVersionIdSchema.parse(
  "curriculum:course-1:1"
)
const choiceStep = lessonStepDtoSchema.parse({
  correct: "option-b",
  explanation: "둘째가 정답입니다.",
  id: "step-1",
  options: [
    { id: "option-a", text: "첫째" },
    { id: "option-b", text: "둘째" },
  ],
  question: "정답은?",
  sortOrder: 1,
  type: "MULTIPLE_CHOICE",
})
const readingStep = lessonStepDtoSchema.parse({
  body: "본문",
  guide: "읽기",
  id: "step-2",
  sortOrder: 2,
  title: "마무리",
  type: "READING",
})
const correctCompletion = {
  kind: "answer",
  submission: learnerStepSubmissionSchema.parse({
    selectedOptionId: "option-b",
    type: "MULTIPLE_CHOICE",
  }),
} as const satisfies LearnerStepCompletion
const snapshot = {
  completedLessonIds: [],
  courseCompletionLessonIds: [lessonId, nextLessonId],
  hasSavedAnswer: false,
  kind: "lesson",
  orderedLessonIds: [lessonId, nextLessonId],
  progress: { currentStepId: choiceStep.id, kind: "in-progress" },
  scope: { courseId, curriculumVersionId, lessonId, revision: 1 },
  steps: [choiceStep, readingStep],
} as const satisfies CompleteStepSnapshot

describe("학습 단계 완료 effect plan", () => {
  it("scope 부재를 published 존재 여부에 따라 not-found와 locked로 구분한다", () => {
    const command = createCommand(choiceStep.id, correctCompletion)

    expect(
      planCompleteStep(command, {
        kind: "lesson-scope-missing",
        publishedLessonExists: false,
      })
    ).toEqual({
      error: { kind: "lesson-not-found", lessonId },
      kind: "rejected",
    })
    expect(
      planCompleteStep(command, {
        kind: "lesson-scope-missing",
        publishedLessonExists: true,
      })
    ).toEqual({
      error: { kind: "lesson-locked", lessonId },
      kind: "rejected",
    })
  })

  it("선행 lesson 미완료는 쓰기 없는 locked plan이다", () => {
    const plan = planCompleteStep(
      createCommand(choiceStep.id, correctCompletion),
      {
        ...snapshot,
        orderedLessonIds: [nextLessonId, lessonId],
      }
    )

    expect(plan).toEqual({
      error: { kind: "lesson-locked", lessonId },
      kind: "rejected",
    })
  })

  it("시작 전 진행과 미래 step 제출을 sequence conflict로 거부한다", () => {
    expect(
      planCompleteStep(createCommand(choiceStep.id, correctCompletion), {
        ...snapshot,
        progress: { kind: "not-started" },
      })
    ).toMatchObject({
      error: { kind: "step-sequence-conflict" },
      kind: "rejected",
    })
    expect(
      planCompleteStep(
        createCommand(readingStep.id, { kind: "acknowledge" }),
        snapshot
      )
    ).toMatchObject({
      error: { kind: "step-sequence-conflict" },
      kind: "rejected",
    })
  })

  it("invalid 제출은 거부하고 유효한 오답은 effect 없는 retry다", () => {
    const invalid = planCompleteStep(
      createCommand(choiceStep.id, {
        kind: "answer",
        submission: learnerStepSubmissionSchema.parse({
          selectedOptionId: "unknown",
          type: "MULTIPLE_CHOICE",
        }),
      }),
      snapshot
    )
    const retry = planCompleteStep(
      createCommand(choiceStep.id, {
        kind: "answer",
        submission: learnerStepSubmissionSchema.parse({
          selectedOptionId: "option-a",
          type: "MULTIPLE_CHOICE",
        }),
      }),
      snapshot
    )

    expect(invalid).toMatchObject({
      error: { kind: "invalid-request" },
      kind: "rejected",
    })
    expect(retry).toMatchObject({
      effects: [],
      evaluation: { correct: false },
      kind: "retry",
    })
  })

  it("과거 step과 완료 lesson replay는 effect를 만들지 않는다", () => {
    const advanced = planCompleteStep(
      createCommand(choiceStep.id, correctCompletion),
      {
        ...snapshot,
        progress: { currentStepId: readingStep.id, kind: "in-progress" },
      }
    )
    const completed = planCompleteStep(
      createCommand(choiceStep.id, correctCompletion),
      { ...snapshot, progress: { kind: "completed" } }
    )

    expect(advanced).toMatchObject({
      effects: [],
      kind: "replay-advanced",
    })
    expect(completed).toMatchObject({
      effects: [],
      kind: "replay-completed",
    })
  })

  it("정답 수락은 답안→step 전진→활동 순서의 plan을 만든다", () => {
    const plan = planCompleteStep(
      createCommand(choiceStep.id, correctCompletion),
      snapshot
    )

    expect(plan).toMatchObject({
      effects: [
        { kind: "save-accepted-answer", stepId: choiceStep.id },
        {
          fromStepId: choiceStep.id,
          kind: "advance-lesson-step",
          nextStepId: readingStep.id,
        },
        {
          activityDate: "2026-07-17",
          completedLessons: 0,
          kind: "record-learning-activity",
          savedAnswers: 1,
        },
      ],
      evaluation: { correct: true },
      kind: "accept-step",
    })
    if (plan.kind === "accept-step") {
      expect(plan.effects.map((effect) => effect.kind)).toEqual([
        "save-accepted-answer",
        "advance-lesson-step",
        "record-learning-activity",
      ])
    }
  })

  it("이미 저장된 답안은 다시 저장하거나 활동 답안 수를 늘리지 않는다", () => {
    const plan = planCompleteStep(
      createCommand(choiceStep.id, correctCompletion),
      { ...snapshot, hasSavedAnswer: true }
    )

    expect(plan).toMatchObject({
      effects: [
        { kind: "advance-lesson-step" },
        { kind: "record-learning-activity", savedAnswers: 0 },
      ],
      kind: "accept-step",
    })
  })

  it("마지막 step은 lesson을 완료하고 남은 lesson이 없을 때만 course를 완료한다", () => {
    const command = createCommand(readingStep.id, { kind: "acknowledge" })
    const inProgressCourse = planCompleteStep(command, {
      ...snapshot,
      progress: { currentStepId: readingStep.id, kind: "in-progress" },
    })
    const completedCourse = planCompleteStep(command, {
      ...snapshot,
      completedLessonIds: [nextLessonId],
      progress: { currentStepId: readingStep.id, kind: "in-progress" },
    })

    expect(inProgressCourse).toMatchObject({
      effects: [
        { kind: "complete-lesson" },
        { completedLessons: 1, kind: "record-learning-activity" },
      ],
      kind: "accept-lesson",
    })
    expect(completedCourse).toMatchObject({
      effects: [
        { kind: "complete-lesson" },
        { kind: "complete-course" },
        { completedLessons: 1, kind: "record-learning-activity" },
      ],
      kind: "accept-lesson",
    })
    if (completedCourse.kind === "accept-lesson") {
      expect(completedCourse.effects.map((effect) => effect.kind)).toEqual([
        "complete-lesson",
        "complete-course",
        "record-learning-activity",
      ])
    }
  })
})

function createCommand(
  stepId: CompleteLearnerStepCommand["stepId"],
  completion: LearnerStepCompletion
): CompleteLearnerStepCommand {
  return { completion, lessonId, occurredAt, stepId, userId }
}
