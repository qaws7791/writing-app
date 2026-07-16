import { and, asc, eq, sql } from "drizzle-orm"
import { z } from "zod"

import {
  completeLearnerStepResultSchema,
  courseLearningStateSchema,
  curriculumVersionIdSchema,
  inProgressLessonLearningStateSchema,
  lessonLearningStateSchema,
  learnerStepSubmissionSchema,
  type CompleteLearnerStepResult,
  type CourseLearningState,
  type LessonLearningState,
} from "@workspace/contracts/learning"
import {
  lessonStepDtoSchema,
  type LessonStepDto,
} from "@workspace/contracts/content"
import type { WritingAppDatabase } from "@workspace/db/client"
import {
  courseCurriculumVersions,
  courses,
  courseUnitVersions,
  aiFeedbackAttempts,
  learnerActivityDays,
  learnerCourseProgress,
  learnerLessonAnswers,
  learnerLessonProgress,
  lessonStepVersions,
  lessonVersions,
} from "@workspace/db/schema"

import type { LearnerTransitionRepository } from "#core/modules/learning/application/ports/learner-transition.repository"
import type {
  CompleteLearnerAiFeedbackCommand,
  CompleteLearnerStepCommand,
  LearnerTransitionError,
  PrepareLearnerAiFeedbackCommand,
  StartLearnerLessonCommand,
} from "#core/modules/learning/domain/learner-transition"
import { toLearningDateKey } from "#core/modules/learning/domain/learning-date"
import { gradeLearnerStep } from "#core/modules/learning/domain/step-grading-policy"
import { err, ok, type Result } from "#core/shared/result"

type LearningTransaction = Parameters<
  Parameters<WritingAppDatabase["transaction"]>[0]
>[0]

type TransitionDatabase = WritingAppDatabase | LearningTransaction

type LessonScope = {
  readonly courseId: string
  readonly curriculumVersionId: string
  readonly lessonId: string
  readonly revision: number
}

type OrderedLesson = {
  readonly estimatedMinutes: number
  readonly id: string
  readonly title: string
}

const activeStatus = "active" as const
const completedStatus = "completed" as const
const inProgressStatus = "in_progress" as const
const rawStepContentSchema = z.object({ type: z.string() }).passthrough()

export function createDrizzleLearnerTransitionRepository(
  db: WritingAppDatabase
): LearnerTransitionRepository {
  return {
    async completeAiFeedbackStep(command) {
      return db.transaction(
        (transaction) => completeAiFeedbackStep(transaction, command),
        { behavior: "immediate" }
      )
    },
    async completeStep(command) {
      return db.transaction(
        (transaction) => completeStep(transaction, command),
        { behavior: "immediate" }
      )
    },
    async prepareAiFeedback(command) {
      return prepareAiFeedback(db, command)
    },
    async startLesson(command) {
      return db.transaction(
        (transaction) => startLesson(transaction, command),
        { behavior: "immediate" }
      )
    },
  }
}

function prepareAiFeedback(
  db: WritingAppDatabase,
  command: PrepareLearnerAiFeedbackCommand
): Result<
  {
    readonly answer: string
    readonly focus: string
    readonly lessonTitle: string
  },
  LearnerTransitionError
> {
  const scope = findPinnedLessonScope(db, command)
  if (scope === null) {
    const published = findPublishedLessonScope(db, command.lessonId)
    return published === null
      ? err({ kind: "lesson-not-found", lessonId: command.lessonId })
      : err({ kind: "lesson-locked", lessonId: command.lessonId })
  }
  const lessons = readOrderedLessons(db, scope)
  if (!isLessonUnlocked(db, command.userId, scope, lessons)) {
    return err({ kind: "lesson-locked", lessonId: command.lessonId })
  }
  const steps = readLessonSteps(db, scope)
  const requestedStepIndex = steps.findIndex(
    (step) => step.id === command.stepId
  )
  const requestedStep = steps[requestedStepIndex]
  if (requestedStepIndex < 0 || requestedStep === undefined) {
    return err({
      kind: "invalid-request",
      lessonId: command.lessonId,
      stepId: command.stepId,
    })
  }
  if (requestedStep.content.type !== "AI_FEEDBACK") {
    return err({
      kind: "invalid-request",
      lessonId: command.lessonId,
      stepId: command.stepId,
    })
  }
  const aiStep = requestedStep.content
  const progress = readLessonProgress(db, command.userId, scope)
  if (progress === null) {
    return err({
      kind: "step-sequence-conflict",
      lessonId: command.lessonId,
      stepId: command.stepId,
    })
  }
  const currentStepIndex = steps.findIndex(
    (step) => step.id === progress.currentStepId
  )
  if (
    progress.status !== completedStatus &&
    requestedStepIndex > currentStepIndex
  ) {
    return err({
      kind: "step-sequence-conflict",
      lessonId: command.lessonId,
      stepId: command.stepId,
    })
  }

  const targetStepIndex = steps.findIndex((step) => step.id === aiStep.target)
  const targetStep = steps[targetStepIndex]
  if (targetStep === undefined) {
    return err({
      kind: "feedback-target-invalid",
      reason: "target-step-not-found",
      stepId: command.stepId,
    })
  }
  if (targetStep.content.type !== "WRITE") {
    return err({
      kind: "feedback-target-invalid",
      reason: "target-step-not-write",
      stepId: command.stepId,
    })
  }
  if (targetStepIndex >= requestedStepIndex) {
    return err({
      kind: "feedback-target-invalid",
      reason: "target-step-not-before-feedback",
      stepId: command.stepId,
    })
  }
  const answerRow = db
    .select({ answerJson: learnerLessonAnswers.answerJson })
    .from(learnerLessonAnswers)
    .where(
      and(
        eq(learnerLessonAnswers.userId, command.userId),
        eq(learnerLessonAnswers.curriculumVersionId, scope.curriculumVersionId),
        eq(learnerLessonAnswers.lessonId, command.lessonId),
        eq(learnerLessonAnswers.stepId, targetStep.id)
      )
    )
    .get()
  const answer = parseStoredAnswer(answerRow?.answerJson)
  if (answer === null || !("type" in answer) || answer.type !== "WRITE") {
    return err({
      kind: "feedback-answer-not-found",
      targetStepId: targetStep.content.id,
    })
  }
  const lesson = db
    .select({ title: lessonVersions.title })
    .from(lessonVersions)
    .where(
      and(
        eq(lessonVersions.curriculumVersionId, scope.curriculumVersionId),
        eq(lessonVersions.id, command.lessonId)
      )
    )
    .get()
  if (lesson === undefined) {
    return err({ kind: "lesson-not-found", lessonId: command.lessonId })
  }
  return ok({
    answer: answer.text,
    focus: aiStep.focus,
    lessonTitle: lesson.title,
  })
}

function parseStoredAnswer(value: string | undefined) {
  if (value === undefined) return null
  try {
    const result = learnerStepSubmissionSchema.safeParse(JSON.parse(value))
    return result.success ? result.data : null
  } catch {
    return null
  }
}

function startLesson(
  transaction: LearningTransaction,
  command: StartLearnerLessonCommand
): Result<LessonLearningState, LearnerTransitionError> {
  const existingScope = findPinnedLessonScope(transaction, command)
  const scopeResult =
    existingScope === null
      ? findPublishedLessonScope(transaction, command.lessonId)
      : existingScope

  if (scopeResult === null) {
    return err({ kind: "lesson-not-found", lessonId: command.lessonId })
  }
  if (scopeResult.curriculumVersionId !== command.expectedCurriculumVersionId) {
    return err({
      kind: "curriculum-version-changed",
      lessonId: command.lessonId,
    })
  }

  const lessons = readOrderedLessons(transaction, scopeResult)
  if (!isLessonUnlocked(transaction, command.userId, scopeResult, lessons)) {
    return err({ kind: "lesson-locked", lessonId: command.lessonId })
  }

  const steps = readLessonSteps(transaction, scopeResult)
  const firstStep = steps[0]
  if (firstStep === undefined) {
    return err({ kind: "lesson-not-found", lessonId: command.lessonId })
  }

  transaction
    .insert(learnerCourseProgress)
    .values({
      completedAt: null,
      courseId: scopeResult.courseId,
      curriculumVersionId: scopeResult.curriculumVersionId,
      lastActivityAt: command.occurredAt,
      startedAt: command.occurredAt,
      status: inProgressStatus,
      updatedAt: command.occurredAt,
      userId: command.userId,
    })
    .onConflictDoNothing()
    .run()

  transaction
    .insert(learnerLessonProgress)
    .values({
      completedAt: null,
      courseId: scopeResult.courseId,
      curriculumVersionId: scopeResult.curriculumVersionId,
      currentStepId: firstStep.id,
      lessonId: scopeResult.lessonId,
      startedAt: command.occurredAt,
      status: inProgressStatus,
      updatedAt: command.occurredAt,
      userId: command.userId,
    })
    .onConflictDoNothing()
    .run()

  recordActivity(transaction, scopeResult, command.userId, command.occurredAt)
  recordActivityDay(transaction, {
    completedLessons: 0,
    occurredAt: command.occurredAt,
    savedAnswers: 0,
    userId: command.userId,
  })

  return ok(
    readLessonLearningState(transaction, command.userId, scopeResult, steps)
  )
}

function completeStep(
  transaction: LearningTransaction,
  command: CompleteLearnerStepCommand
): Result<CompleteLearnerStepResult, LearnerTransitionError> {
  const scope = findPinnedLessonScope(transaction, command)
  if (scope === null) {
    const published = findPublishedLessonScope(transaction, command.lessonId)
    return published === null
      ? err({ kind: "lesson-not-found", lessonId: command.lessonId })
      : err({ kind: "lesson-locked", lessonId: command.lessonId })
  }

  const lessons = readOrderedLessons(transaction, scope)
  if (!isLessonUnlocked(transaction, command.userId, scope, lessons)) {
    return err({ kind: "lesson-locked", lessonId: command.lessonId })
  }

  const steps = readLessonSteps(transaction, scope)
  const requestedStepIndex = steps.findIndex(
    (step) => step.id === command.stepId
  )
  if (requestedStepIndex < 0) {
    return err({
      kind: "step-sequence-conflict",
      lessonId: command.lessonId,
      stepId: command.stepId,
    })
  }

  const progress = readLessonProgress(transaction, command.userId, scope)
  if (progress === null) {
    return err({
      kind: "step-sequence-conflict",
      lessonId: command.lessonId,
      stepId: command.stepId,
    })
  }
  if (progress.status === completedStatus) {
    return ok(readCompletedResult(transaction, command.userId, scope, steps))
  }

  const currentStepIndex = steps.findIndex(
    (step) => step.id === progress.currentStepId
  )
  if (requestedStepIndex < currentStepIndex) {
    return ok({
      evaluation: null,
      learning: readInProgressState(transaction, command.userId, scope, steps),
      status: "advanced",
    })
  }
  if (requestedStepIndex !== currentStepIndex) {
    return err({
      kind: "step-sequence-conflict",
      lessonId: command.lessonId,
      stepId: command.stepId,
    })
  }

  const step = steps[requestedStepIndex]
  if (step === undefined) throw new Error("Current step was not found")
  const grading = gradeLearnerStep(step.content, command.request)
  if (grading.kind === "invalid") {
    return err({
      kind: "invalid-request",
      lessonId: command.lessonId,
      stepId: command.stepId,
    })
  }
  if (grading.kind === "retry") {
    return ok({
      evaluation: grading.evaluation,
      learning: readInProgressState(transaction, command.userId, scope, steps),
      status: "retry",
    })
  }

  const answerWasSaved =
    grading.answer === null
      ? false
      : saveAcceptedAnswer(transaction, command, scope, grading.answer)
  return ok(
    advanceAcceptedStep(transaction, {
      answerWasSaved,
      evaluation: grading.evaluation,
      lessonId: command.lessonId,
      occurredAt: command.occurredAt,
      requestedStepIndex,
      scope,
      stepId: command.stepId,
      steps,
      userId: command.userId,
    })
  )
}

function completeAiFeedbackStep(
  transaction: LearningTransaction,
  command: CompleteLearnerAiFeedbackCommand
): Result<CompleteLearnerStepResult, LearnerTransitionError> {
  const scope = findPinnedLessonScope(transaction, command)
  if (scope === null) {
    return err({ kind: "lesson-locked", lessonId: command.lessonId })
  }
  const lessons = readOrderedLessons(transaction, scope)
  if (!isLessonUnlocked(transaction, command.userId, scope, lessons)) {
    return err({ kind: "lesson-locked", lessonId: command.lessonId })
  }
  const steps = readLessonSteps(transaction, scope)
  const requestedStepIndex = steps.findIndex(
    (step) => step.id === command.stepId
  )
  const requestedStep = steps[requestedStepIndex]
  if (requestedStepIndex < 0 || requestedStep?.content.type !== "AI_FEEDBACK") {
    return err({
      kind: "invalid-request",
      lessonId: command.lessonId,
      stepId: command.stepId,
    })
  }
  const progress = readLessonProgress(transaction, command.userId, scope)
  if (progress === null) {
    return err({
      kind: "step-sequence-conflict",
      lessonId: command.lessonId,
      stepId: command.stepId,
    })
  }
  const currentStepIndex = steps.findIndex(
    (step) => step.id === progress.currentStepId
  )
  if (
    progress.status !== completedStatus &&
    requestedStepIndex > currentStepIndex
  ) {
    return err({
      kind: "step-sequence-conflict",
      lessonId: command.lessonId,
      stepId: command.stepId,
    })
  }

  const attempt = transaction
    .select({ status: aiFeedbackAttempts.status })
    .from(aiFeedbackAttempts)
    .where(
      and(
        eq(aiFeedbackAttempts.id, command.attemptId),
        eq(aiFeedbackAttempts.userId, command.userId),
        eq(aiFeedbackAttempts.curriculumVersionId, scope.curriculumVersionId),
        eq(aiFeedbackAttempts.lessonId, command.lessonId),
        eq(aiFeedbackAttempts.stepId, command.stepId)
      )
    )
    .get()
  if (
    attempt === undefined ||
    (attempt.status !== "pending" && attempt.status !== "succeeded")
  ) {
    return err({
      kind: "invalid-request",
      lessonId: command.lessonId,
      stepId: command.stepId,
    })
  }

  transaction
    .update(aiFeedbackAttempts)
    .set({
      resultJson: JSON.stringify(command.feedback),
      status: "succeeded",
      updatedAt: command.occurredAt,
    })
    .where(
      and(
        eq(aiFeedbackAttempts.id, command.attemptId),
        eq(aiFeedbackAttempts.status, "pending")
      )
    )
    .run()

  if (progress.status === completedStatus) {
    return ok(readCompletedResult(transaction, command.userId, scope, steps))
  }
  if (requestedStepIndex < currentStepIndex) {
    return ok({
      evaluation: null,
      learning: readInProgressState(transaction, command.userId, scope, steps),
      status: "advanced",
    })
  }
  return ok(
    advanceAcceptedStep(transaction, {
      answerWasSaved: false,
      evaluation: null,
      lessonId: command.lessonId,
      occurredAt: command.occurredAt,
      requestedStepIndex,
      scope,
      stepId: command.stepId,
      steps,
      userId: command.userId,
    })
  )
}

function advanceAcceptedStep(
  transaction: LearningTransaction,
  input: {
    readonly answerWasSaved: boolean
    readonly evaluation: CompleteLearnerStepResult["evaluation"]
    readonly lessonId: CompleteLearnerStepCommand["lessonId"]
    readonly occurredAt: Date
    readonly requestedStepIndex: number
    readonly scope: LessonScope
    readonly stepId: CompleteLearnerStepCommand["stepId"]
    readonly steps: ReturnType<typeof readLessonSteps>
    readonly userId: CompleteLearnerStepCommand["userId"]
  }
): CompleteLearnerStepResult {
  const nextStep = input.steps[input.requestedStepIndex + 1]
  if (nextStep !== undefined) {
    transaction
      .update(learnerLessonProgress)
      .set({ currentStepId: nextStep.id, updatedAt: input.occurredAt })
      .where(
        and(
          eq(learnerLessonProgress.userId, input.userId),
          eq(
            learnerLessonProgress.curriculumVersionId,
            input.scope.curriculumVersionId
          ),
          eq(learnerLessonProgress.lessonId, input.scope.lessonId),
          eq(learnerLessonProgress.currentStepId, input.stepId),
          eq(learnerLessonProgress.status, inProgressStatus)
        )
      )
      .run()
    recordTransitionActivity(
      transaction,
      input,
      input.scope,
      input.answerWasSaved,
      false
    )
    return completeLearnerStepResultSchema.parse({
      evaluation: input.evaluation,
      learning: readInProgressState(
        transaction,
        input.userId,
        input.scope,
        input.steps
      ),
      status: "advanced",
    })
  }

  transaction
    .update(learnerLessonProgress)
    .set({
      completedAt: input.occurredAt,
      status: completedStatus,
      updatedAt: input.occurredAt,
    })
    .where(
      and(
        eq(learnerLessonProgress.userId, input.userId),
        eq(
          learnerLessonProgress.curriculumVersionId,
          input.scope.curriculumVersionId
        ),
        eq(learnerLessonProgress.lessonId, input.scope.lessonId),
        eq(learnerLessonProgress.currentStepId, input.stepId),
        eq(learnerLessonProgress.status, inProgressStatus)
      )
    )
    .run()
  updateCourseCompletion(
    transaction,
    input.scope,
    input.userId,
    input.occurredAt
  )
  recordTransitionActivity(
    transaction,
    input,
    input.scope,
    input.answerWasSaved,
    true
  )

  const completed = readCompletedResult(
    transaction,
    input.userId,
    input.scope,
    input.steps
  )
  return completeLearnerStepResultSchema.parse({
    ...completed,
    evaluation: input.evaluation,
  })
}

function findPinnedLessonScope(
  db: TransitionDatabase,
  command: { readonly lessonId: string; readonly userId: string }
): LessonScope | null {
  return (
    db
      .select({
        courseId: learnerCourseProgress.courseId,
        curriculumVersionId: learnerCourseProgress.curriculumVersionId,
        lessonId: lessonVersions.id,
        revision: courseCurriculumVersions.revision,
      })
      .from(learnerCourseProgress)
      .innerJoin(
        courseCurriculumVersions,
        eq(
          courseCurriculumVersions.id,
          learnerCourseProgress.curriculumVersionId
        )
      )
      .innerJoin(
        lessonVersions,
        and(
          eq(
            lessonVersions.curriculumVersionId,
            learnerCourseProgress.curriculumVersionId
          ),
          eq(lessonVersions.id, command.lessonId)
        )
      )
      .where(eq(learnerCourseProgress.userId, command.userId))
      .get() ?? null
  )
}

function findPublishedLessonScope(
  db: TransitionDatabase,
  lessonId: string
): LessonScope | null {
  return (
    db
      .select({
        courseId: courses.id,
        curriculumVersionId: courseCurriculumVersions.id,
        lessonId: lessonVersions.id,
        revision: courseCurriculumVersions.revision,
      })
      .from(courses)
      .innerJoin(
        courseCurriculumVersions,
        eq(courseCurriculumVersions.id, courses.publishedCurriculumVersionId)
      )
      .innerJoin(
        lessonVersions,
        and(
          eq(lessonVersions.curriculumVersionId, courseCurriculumVersions.id),
          eq(lessonVersions.id, lessonId),
          eq(lessonVersions.status, activeStatus)
        )
      )
      .where(eq(courses.status, activeStatus))
      .get() ?? null
  )
}

function readOrderedLessons(
  db: TransitionDatabase,
  scope: LessonScope
): readonly OrderedLesson[] {
  return db
    .select({
      estimatedMinutes: lessonVersions.estimatedMinutes,
      id: lessonVersions.id,
      title: lessonVersions.title,
    })
    .from(lessonVersions)
    .innerJoin(
      courseUnitVersions,
      and(
        eq(
          courseUnitVersions.curriculumVersionId,
          lessonVersions.curriculumVersionId
        ),
        eq(courseUnitVersions.id, lessonVersions.unitId),
        eq(courseUnitVersions.status, activeStatus)
      )
    )
    .where(
      and(
        eq(lessonVersions.curriculumVersionId, scope.curriculumVersionId),
        eq(lessonVersions.status, activeStatus)
      )
    )
    .orderBy(asc(courseUnitVersions.sortOrder), asc(lessonVersions.sortOrder))
    .all()
}

function isLessonUnlocked(
  db: TransitionDatabase,
  userId: string,
  scope: LessonScope,
  lessons: readonly OrderedLesson[]
): boolean {
  const lessonIndex = lessons.findIndex(
    (lesson) => lesson.id === scope.lessonId
  )
  if (lessonIndex < 0) return false
  const completedLessonIds = new Set(
    db
      .select({ id: learnerLessonProgress.lessonId })
      .from(learnerLessonProgress)
      .where(
        and(
          eq(learnerLessonProgress.userId, userId),
          eq(
            learnerLessonProgress.curriculumVersionId,
            scope.curriculumVersionId
          ),
          eq(learnerLessonProgress.status, completedStatus)
        )
      )
      .all()
      .map((row) => row.id)
  )
  return lessons
    .slice(0, lessonIndex)
    .every((lesson) => completedLessonIds.has(lesson.id))
}

function readLessonSteps(db: TransitionDatabase, scope: LessonScope) {
  return db
    .select()
    .from(lessonStepVersions)
    .where(
      and(
        eq(lessonStepVersions.curriculumVersionId, scope.curriculumVersionId),
        eq(lessonStepVersions.lessonId, scope.lessonId),
        eq(lessonStepVersions.status, activeStatus)
      )
    )
    .orderBy(asc(lessonStepVersions.sortOrder))
    .all()
    .map((row) => ({ ...row, content: toInternalStep(row) }))
}

function toInternalStep(
  row: typeof lessonStepVersions.$inferSelect
): LessonStepDto {
  const parsed = rawStepContentSchema.parse(JSON.parse(row.contentJson))
  const { type: _sourceType, ...content } = parsed
  return lessonStepDtoSchema.parse({
    ...content,
    id: row.id,
    sortOrder: row.sortOrder,
    type: row.type,
  })
}

function readLessonProgress(
  db: TransitionDatabase,
  userId: string,
  scope: LessonScope
) {
  return (
    db
      .select({
        completedAt: learnerLessonProgress.completedAt,
        currentStepId: learnerLessonProgress.currentStepId,
        status: learnerLessonProgress.status,
        updatedAt: learnerLessonProgress.updatedAt,
      })
      .from(learnerLessonProgress)
      .where(
        and(
          eq(learnerLessonProgress.userId, userId),
          eq(
            learnerLessonProgress.curriculumVersionId,
            scope.curriculumVersionId
          ),
          eq(learnerLessonProgress.lessonId, scope.lessonId)
        )
      )
      .get() ?? null
  )
}

function readLessonLearningState(
  db: TransitionDatabase,
  userId: string,
  scope: LessonScope,
  steps: readonly { readonly id: string }[]
): LessonLearningState {
  const progress = readLessonProgress(db, userId, scope)
  const version = {
    curriculumVersionId: curriculumVersionIdSchema.parse(
      scope.curriculumVersionId
    ),
    revision: scope.revision,
  }
  if (progress === null) {
    return lessonLearningStateSchema.parse({
      status: "not_started",
      totalSteps: steps.length,
      version,
    })
  }
  if (progress.status === completedStatus) {
    return lessonLearningStateSchema.parse({
      completion: {
        completedAt: toIso(progress.completedAt ?? progress.updatedAt),
        totalSteps: steps.length,
      },
      status: "completed",
      version,
    })
  }
  const currentStepIndex = steps.findIndex(
    (step) => step.id === progress.currentStepId
  )
  if (currentStepIndex < 0) throw new Error("Stored current step was not found")
  return inProgressLessonLearningStateSchema.parse({
    completedSteps: currentStepIndex,
    currentStepId: progress.currentStepId,
    currentStepIndex,
    progressPercent:
      steps.length === 0
        ? 0
        : Math.round((currentStepIndex / steps.length) * 100),
    status: "in_progress",
    totalSteps: steps.length,
    version,
  })
}

function readInProgressState(
  db: TransitionDatabase,
  userId: string,
  scope: LessonScope,
  steps: readonly { readonly id: string }[]
) {
  return inProgressLessonLearningStateSchema.parse(
    readLessonLearningState(db, userId, scope, steps)
  )
}

function saveAcceptedAnswer(
  transaction: LearningTransaction,
  command: CompleteLearnerStepCommand,
  scope: LessonScope,
  answer: NonNullable<
    Extract<ReturnType<typeof gradeLearnerStep>, { kind: "accepted" }>["answer"]
  >
): boolean {
  const existing = transaction
    .select({ stepId: learnerLessonAnswers.stepId })
    .from(learnerLessonAnswers)
    .where(
      and(
        eq(learnerLessonAnswers.userId, command.userId),
        eq(learnerLessonAnswers.curriculumVersionId, scope.curriculumVersionId),
        eq(learnerLessonAnswers.stepId, command.stepId)
      )
    )
    .get()
  transaction
    .insert(learnerLessonAnswers)
    .values({
      answerJson: JSON.stringify(answer),
      answeredAt: command.occurredAt,
      courseId: scope.courseId,
      curriculumVersionId: scope.curriculumVersionId,
      lessonId: scope.lessonId,
      stepId: command.stepId,
      updatedAt: command.occurredAt,
      userId: command.userId,
    })
    .onConflictDoNothing()
    .run()
  return existing === undefined
}

function readCompletedResult(
  db: TransitionDatabase,
  userId: string,
  scope: LessonScope,
  steps: readonly { readonly id: string }[]
): CompleteLearnerStepResult {
  const learning = readLessonLearningState(db, userId, scope, steps)
  if (learning.status !== completedStatus) {
    throw new Error("Lesson completion was not stored")
  }
  return completeLearnerStepResultSchema.parse({
    courseLearning: readCourseLearningState(db, userId, scope),
    evaluation: null,
    lessonCompletion: learning.completion,
    status: "lesson_completed",
  })
}

function readCourseLearningState(
  db: TransitionDatabase,
  userId: string,
  scope: LessonScope
): CourseLearningState {
  const lessons = readOrderedLessons(db, scope)
  const progressRows = db
    .select({
      completedAt: learnerLessonProgress.completedAt,
      currentStepId: learnerLessonProgress.currentStepId,
      lessonId: learnerLessonProgress.lessonId,
      status: learnerLessonProgress.status,
      updatedAt: learnerLessonProgress.updatedAt,
    })
    .from(learnerLessonProgress)
    .where(
      and(
        eq(learnerLessonProgress.userId, userId),
        eq(learnerLessonProgress.curriculumVersionId, scope.curriculumVersionId)
      )
    )
    .all()
  const progressByLessonId = new Map(
    progressRows.map((progress) => [progress.lessonId, progress])
  )
  const completedLessons = progressRows.filter(
    (progress) => progress.status === completedStatus
  ).length
  const courseProgress = db
    .select()
    .from(learnerCourseProgress)
    .where(
      and(
        eq(learnerCourseProgress.userId, userId),
        eq(learnerCourseProgress.courseId, scope.courseId),
        eq(learnerCourseProgress.curriculumVersionId, scope.curriculumVersionId)
      )
    )
    .get()
  if (courseProgress === undefined) throw new Error("Course progress not found")
  const version = {
    curriculumVersionId: curriculumVersionIdSchema.parse(
      scope.curriculumVersionId
    ),
    revision: scope.revision,
  }
  if (courseProgress.status === completedStatus) {
    return courseLearningStateSchema.parse({
      completedAt: toIso(
        courseProgress.completedAt ?? courseProgress.lastActivityAt
      ),
      completedLessons,
      lastActivityAt: toIso(courseProgress.lastActivityAt),
      nextLesson: null,
      progressPercent: 100,
      status: completedStatus,
      totalLessons: lessons.length,
      version,
    })
  }

  const nextLesson = lessons.find(
    (lesson) => progressByLessonId.get(lesson.id)?.status !== completedStatus
  )
  if (nextLesson === undefined) {
    throw new Error("In-progress course has no next lesson")
  }
  const nextProgress = progressByLessonId.get(nextLesson.id)
  const firstStepId = readFirstStepId(
    db,
    scope.curriculumVersionId,
    nextLesson.id
  )
  const currentStepId = nextProgress?.currentStepId ?? firstStepId
  const currentStepIndex = readStepIndex(
    db,
    scope.curriculumVersionId,
    nextLesson.id,
    currentStepId
  )
  return courseLearningStateSchema.parse({
    completedLessons,
    lastActivityAt: toIso(courseProgress.lastActivityAt),
    nextLesson: {
      currentStepId,
      currentStepIndex,
      estimatedMinutes: nextLesson.estimatedMinutes,
      id: nextLesson.id,
      title: nextLesson.title,
    },
    progressPercent:
      lessons.length === 0
        ? 0
        : Math.round((completedLessons / lessons.length) * 100),
    status: inProgressStatus,
    totalLessons: lessons.length,
    version,
  })
}

function readFirstStepId(
  db: TransitionDatabase,
  curriculumVersionId: string,
  lessonId: string
): string {
  const step = db
    .select({ id: lessonStepVersions.id })
    .from(lessonStepVersions)
    .where(
      and(
        eq(lessonStepVersions.curriculumVersionId, curriculumVersionId),
        eq(lessonStepVersions.lessonId, lessonId),
        eq(lessonStepVersions.status, activeStatus)
      )
    )
    .orderBy(asc(lessonStepVersions.sortOrder))
    .get()
  if (step === undefined) throw new Error("Lesson has no active step")
  return step.id
}

function readStepIndex(
  db: TransitionDatabase,
  curriculumVersionId: string,
  lessonId: string,
  stepId: string
): number {
  const step = db
    .select({ sortOrder: lessonStepVersions.sortOrder })
    .from(lessonStepVersions)
    .where(
      and(
        eq(lessonStepVersions.curriculumVersionId, curriculumVersionId),
        eq(lessonStepVersions.lessonId, lessonId),
        eq(lessonStepVersions.id, stepId)
      )
    )
    .get()
  if (step === undefined) throw new Error("Current step was not found")
  return step.sortOrder - 1
}

function updateCourseCompletion(
  transaction: LearningTransaction,
  scope: LessonScope,
  userId: string,
  occurredAt: Date
): void {
  const incompleteLesson = transaction
    .select({ id: lessonVersions.id })
    .from(lessonVersions)
    .where(
      and(
        eq(lessonVersions.curriculumVersionId, scope.curriculumVersionId),
        eq(lessonVersions.status, activeStatus),
        sql`NOT EXISTS (
          SELECT 1 FROM learner_lesson_progress progress
          WHERE progress.user_id = ${userId}
            AND progress.curriculum_version_id = ${scope.curriculumVersionId}
            AND progress.lesson_id = ${lessonVersions.id}
            AND progress.status = ${completedStatus}
        )`
      )
    )
    .get()
  if (incompleteLesson !== undefined) return

  transaction
    .update(learnerCourseProgress)
    .set({
      completedAt: occurredAt,
      lastActivityAt: occurredAt,
      status: completedStatus,
      updatedAt: occurredAt,
    })
    .where(
      and(
        eq(learnerCourseProgress.userId, userId),
        eq(learnerCourseProgress.courseId, scope.courseId),
        eq(
          learnerCourseProgress.curriculumVersionId,
          scope.curriculumVersionId
        ),
        eq(learnerCourseProgress.status, inProgressStatus)
      )
    )
    .run()
}

function recordTransitionActivity(
  transaction: LearningTransaction,
  command: Pick<CompleteLearnerStepCommand, "occurredAt" | "userId">,
  scope: LessonScope,
  answerWasSaved: boolean,
  lessonWasCompleted: boolean
): void {
  recordActivity(transaction, scope, command.userId, command.occurredAt)
  recordActivityDay(transaction, {
    completedLessons: lessonWasCompleted ? 1 : 0,
    occurredAt: command.occurredAt,
    savedAnswers: answerWasSaved ? 1 : 0,
    userId: command.userId,
  })
}

function recordActivity(
  transaction: LearningTransaction,
  scope: LessonScope,
  userId: string,
  occurredAt: Date
): void {
  transaction
    .update(learnerCourseProgress)
    .set({ lastActivityAt: occurredAt, updatedAt: occurredAt })
    .where(
      and(
        eq(learnerCourseProgress.userId, userId),
        eq(learnerCourseProgress.courseId, scope.courseId),
        eq(learnerCourseProgress.curriculumVersionId, scope.curriculumVersionId)
      )
    )
    .run()
}

function recordActivityDay(
  transaction: LearningTransaction,
  input: {
    readonly completedLessons: number
    readonly occurredAt: Date
    readonly savedAnswers: number
    readonly userId: string
  }
): void {
  transaction
    .insert(learnerActivityDays)
    .values({
      activityDate: toLearningDateKey(input.occurredAt),
      completedLessons: input.completedLessons,
      firstActivityAt: input.occurredAt,
      lastActivityAt: input.occurredAt,
      savedAnswers: input.savedAnswers,
      userId: input.userId,
    })
    .onConflictDoUpdate({
      set: {
        completedLessons: sql`${learnerActivityDays.completedLessons} + ${input.completedLessons}`,
        lastActivityAt: input.occurredAt,
        savedAnswers: sql`${learnerActivityDays.savedAnswers} + ${input.savedAnswers}`,
      },
      target: [learnerActivityDays.userId, learnerActivityDays.activityDate],
    })
    .run()
}

function toIso(value: Date): string {
  return value.toISOString()
}
