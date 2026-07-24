import { and, asc, eq } from "drizzle-orm"

import { learnerStepDraftSchema } from "@workspace/contracts/learning/step-data"
import type { WritingAppDatabase } from "@workspace/db/client"
import type {
  CourseId,
  CurriculumVersionId,
  LearnerId,
  LessonId,
} from "@workspace/types/ids"

import type { LearnerStepDraft } from "#learning/domain/learning-types"
import { learnerStepDrafts } from "#learning/infrastructure/persistence/schema"

type LearningTransaction = Parameters<
  Parameters<WritingAppDatabase["transaction"]>[0]
>[0]

type DraftReader = WritingAppDatabase | LearningTransaction

export function readLearnerStepDrafts(
  database: DraftReader,
  input: Readonly<{
    courseId: CourseId
    curriculumVersionId: CurriculumVersionId
    lessonId: LessonId
    userId: LearnerId
  }>
): readonly LearnerStepDraft[] {
  return database
    .select({
      answerJson: learnerStepDrafts.answerJson,
      stepId: learnerStepDrafts.stepId,
      updatedAt: learnerStepDrafts.updatedAt,
      version: learnerStepDrafts.version,
    })
    .from(learnerStepDrafts)
    .where(
      and(
        eq(learnerStepDrafts.userId, input.userId),
        eq(learnerStepDrafts.courseId, input.courseId),
        eq(learnerStepDrafts.curriculumVersionId, input.curriculumVersionId),
        eq(learnerStepDrafts.lessonId, input.lessonId)
      )
    )
    .orderBy(asc(learnerStepDrafts.stepId))
    .all()
    .map((row) =>
      learnerStepDraftSchema.parse({
        answer: parseStoredDraftAnswer(row.answerJson),
        stepId: row.stepId,
        updatedAt: row.updatedAt.toISOString(),
        version: row.version,
      })
    )
}

function parseStoredDraftAnswer(answerJson: string): unknown {
  try {
    return JSON.parse(answerJson)
  } catch {
    throw new Error("Stored learner step draft answer is not valid JSON")
  }
}
