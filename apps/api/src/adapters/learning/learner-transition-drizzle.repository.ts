import { and, asc, eq, sql } from "drizzle-orm"
import { z } from "zod"

import {
  courseLearningStateSchema,
  curriculumVersionIdSchema,
  inProgressLessonLearningStateSchema,
  lessonLearningStateSchema,
  learnerStepSubmissionSchema,
  type CourseLearningState,
  type LessonLearningState,
} from "@workspace/contracts/learning/step-data"
import {
  lessonStepDtoSchema,
  type LessonStepDto,
} from "@workspace/contracts/content/course"
import {
  courseIdSchema,
  lessonIdSchema,
  lessonStepIdSchema,
  type LessonId,
  type LessonStepId,
} from "@workspace/contracts/content/ids"
import type { WritingAppDatabase } from "@workspace/db/client"
import {
  learnerActivityDays,
  learnerCourseProgress,
  learnerLessonAnswers,
  learnerLessonProgress,
} from "@workspace/db/schema"
import {
  courseCurriculumVersions,
  courses,
  courseUnitVersions,
  lessonStepVersions,
  lessonVersions,
} from "@workspace/content/schema"

import {
  decideFinalizeAiFeedback,
  decidePrepareAiFeedbackContext,
  decidePrepareAiFeedbackTarget,
  decideStartLesson,
  planCompleteStep,
  toLearningDateKey,
  type FinalizeAiFeedbackSnapshot,
  type PrepareAiFeedbackTargetSnapshot,
  type CompleteStepEffect,
  type CompleteStepPlan,
  type CompleteStepSnapshot,
  type CompleteLearnerAiFeedbackCommand,
  type CompleteLearnerStepCommand,
  type CompleteLearnerStepTransitionResult,
  type LearnerLessonScope,
  type LearnerAiFeedbackContext,
  type LearnerTransitionError,
  type LearnerTransitionRepository,
  type LearningDateKey,
  type PrepareLearnerAiFeedbackCommand,
  type StartLessonDecision,
  type StartLessonEffect,
  type StartLessonSnapshot,
  type StartLearnerLessonCommand,
} from "@workspace/core/learning"
import { err, ok, type Result } from "@workspace/kernel/result"

type LearningTransaction = Parameters<
  Parameters<WritingAppDatabase["transaction"]>[0]
>[0]

type TransitionDatabase = WritingAppDatabase | LearningTransaction

type LessonScope = LearnerLessonScope

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
): Result<LearnerAiFeedbackContext, LearnerTransitionError> {
  const scope = findPinnedLessonScope(db, command)
  const snapshot: PrepareAiFeedbackTargetSnapshot =
    scope === null
      ? {
          kind: "lesson-scope-missing",
          publishedLessonExists:
            findPublishedLessonScope(db, command.lessonId) !== null,
        }
      : {
          isUnlocked: isLessonUnlocked(
            db,
            command.userId,
            scope,
            readOrderedLessons(db, scope)
          ),
          kind: "lesson",
          progress: toAiFeedbackProgressSnapshot(
            readLessonProgress(db, command.userId, scope)
          ),
          steps: toAiFeedbackStepSnapshots(readLessonSteps(db, scope)),
        }
  const target = decidePrepareAiFeedbackTarget(command, snapshot)
  if (target.kind === "rejected") return err(target.error)
  if (scope === null) {
    throw new Error("Accepted AI feedback target has no pinned lesson scope")
  }

  const answerRow = db
    .select({ answerJson: learnerLessonAnswers.answerJson })
    .from(learnerLessonAnswers)
    .where(
      and(
        eq(learnerLessonAnswers.userId, command.userId),
        eq(learnerLessonAnswers.curriculumVersionId, scope.curriculumVersionId),
        eq(learnerLessonAnswers.lessonId, command.lessonId),
        eq(learnerLessonAnswers.stepId, target.targetStepId)
      )
    )
    .get()
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
  return decidePrepareAiFeedbackContext(command, target, {
    answer: parseStoredAnswer(answerRow?.answerJson),
    courseId: scope.courseId,
    curriculumVersionId: scope.curriculumVersionId,
    lessonTitle: lesson?.title ?? null,
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
  const snapshot = loadStartLessonSnapshot(transaction, command)
  const decision = decideStartLesson(command, snapshot)
  return applyStartLessonDecision(transaction, decision)
}

function loadStartLessonSnapshot(
  transaction: LearningTransaction,
  command: StartLearnerLessonCommand
): StartLessonSnapshot {
  const existingScope = findPinnedLessonScope(transaction, command)
  const scope =
    existingScope ?? findPublishedLessonScope(transaction, command.lessonId)
  if (scope === null) return { kind: "lesson-not-found" }

  const lessons = readOrderedLessons(transaction, scope)
  const progress = readLessonProgress(transaction, command.userId, scope)
  return {
    isUnlocked: isLessonUnlocked(transaction, command.userId, scope, lessons),
    kind: "lesson",
    progress: progress === null ? { kind: "not-started" } : { kind: "started" },
    scope,
    stepIds: readLessonStepIds(transaction, scope),
  }
}

function applyStartLessonDecision(
  transaction: LearningTransaction,
  decision: StartLessonDecision
): Result<LessonLearningState, LearnerTransitionError> {
  if (decision.kind === "rejected") return err(decision.error)

  for (const effect of decision.effects) {
    applyStartLessonEffect(transaction, effect)
  }
  return ok(
    readLessonLearningState(
      transaction,
      decision.userId,
      decision.scope,
      decision.stepIds.map((id) => ({ id }))
    )
  )
}

function applyStartLessonEffect(
  transaction: LearningTransaction,
  effect: StartLessonEffect
): void {
  switch (effect.kind) {
    case "ensure-course-started":
      transaction
        .insert(learnerCourseProgress)
        .values({
          completedAt: null,
          courseId: effect.courseId,
          curriculumVersionId: effect.curriculumVersionId,
          lastActivityAt: effect.occurredAt,
          startedAt: effect.occurredAt,
          status: inProgressStatus,
          updatedAt: effect.occurredAt,
          userId: effect.userId,
        })
        .onConflictDoNothing()
        .run()
      return
    case "ensure-lesson-started":
      transaction
        .insert(learnerLessonProgress)
        .values({
          completedAt: null,
          courseId: effect.courseId,
          curriculumVersionId: effect.curriculumVersionId,
          currentStepId: effect.firstStepId,
          lessonId: effect.lessonId,
          startedAt: effect.occurredAt,
          status: inProgressStatus,
          updatedAt: effect.occurredAt,
          userId: effect.userId,
        })
        .onConflictDoNothing()
        .run()
      return
    case "record-learning-activity":
      recordActivity(transaction, effect, effect.userId, effect.occurredAt)
      recordActivityDay(transaction, {
        activityDate: effect.activityDate,
        completedLessons: 0,
        occurredAt: effect.occurredAt,
        savedAnswers: 0,
        userId: effect.userId,
      })
  }
}

function completeStep(
  transaction: LearningTransaction,
  command: CompleteLearnerStepCommand
): Result<CompleteLearnerStepTransitionResult, LearnerTransitionError> {
  const snapshot = loadCompleteStepSnapshot(transaction, command)
  const plan = planCompleteStep(command, snapshot)
  return applyCompleteStepPlan(transaction, plan)
}

function loadCompleteStepSnapshot(
  transaction: LearningTransaction,
  command: CompleteLearnerStepCommand
): CompleteStepSnapshot {
  const scope = findPinnedLessonScope(transaction, command)
  if (scope === null) {
    return {
      kind: "lesson-scope-missing",
      publishedLessonExists:
        findPublishedLessonScope(transaction, command.lessonId) !== null,
    }
  }

  const orderedLessons = readOrderedLessons(transaction, scope)
  const completedLessonIds = readCompletedLessonIds(
    transaction,
    command.userId,
    scope
  )
  const progress = readLessonProgress(transaction, command.userId, scope)
  return {
    completedLessonIds,
    courseCompletionLessonIds: readCourseCompletionLessonIds(
      transaction,
      scope
    ),
    hasSavedAnswer: hasSavedAnswer(transaction, command, scope),
    kind: "lesson",
    orderedLessonIds: orderedLessons.map((lesson) =>
      lessonIdSchema.parse(lesson.id)
    ),
    progress:
      progress === null
        ? { kind: "not-started" }
        : progress.status === completedStatus
          ? { kind: "completed" }
          : {
              currentStepId: lessonStepIdSchema.parse(progress.currentStepId),
              kind: "in-progress",
            },
    scope,
    steps: readLessonSteps(transaction, scope).map((step) => step.content),
  }
}

function applyCompleteStepPlan(
  transaction: LearningTransaction,
  plan: CompleteStepPlan
): Result<CompleteLearnerStepTransitionResult, LearnerTransitionError> {
  if (plan.kind === "rejected") return err(plan.error)

  for (const effect of plan.effects) {
    applyCompleteStepEffect(transaction, effect)
  }
  const steps = plan.stepIds.map((id) => ({ id }))
  switch (plan.kind) {
    case "retry":
      return ok({
        evaluation: plan.evaluation,
        kind: "retry",
        learning: readInProgressState(
          transaction,
          plan.userId,
          plan.scope,
          steps
        ),
      })
    case "replay-advanced":
    case "accept-step":
      return ok({
        evaluation: plan.evaluation,
        kind: "advanced",
        learning: readInProgressState(
          transaction,
          plan.userId,
          plan.scope,
          steps
        ),
      })
    case "replay-completed":
      return ok(
        readCompletedResult(transaction, plan.userId, plan.scope, steps)
      )
    case "accept-lesson": {
      const completed = readCompletedResult(
        transaction,
        plan.userId,
        plan.scope,
        steps
      )
      return ok({ ...completed, evaluation: plan.evaluation })
    }
  }
}

function applyCompleteStepEffect(
  transaction: LearningTransaction,
  effect: CompleteStepEffect
): void {
  switch (effect.kind) {
    case "save-accepted-answer":
      transaction
        .insert(learnerLessonAnswers)
        .values({
          answerJson: JSON.stringify(effect.answer),
          answeredAt: effect.occurredAt,
          courseId: effect.courseId,
          curriculumVersionId: effect.curriculumVersionId,
          lessonId: effect.lessonId,
          stepId: effect.stepId,
          updatedAt: effect.occurredAt,
          userId: effect.userId,
        })
        .onConflictDoNothing()
        .run()
      return
    case "advance-lesson-step":
      transaction
        .update(learnerLessonProgress)
        .set({
          currentStepId: effect.nextStepId,
          updatedAt: effect.occurredAt,
        })
        .where(
          and(
            eq(learnerLessonProgress.userId, effect.userId),
            eq(
              learnerLessonProgress.curriculumVersionId,
              effect.curriculumVersionId
            ),
            eq(learnerLessonProgress.lessonId, effect.lessonId),
            eq(learnerLessonProgress.currentStepId, effect.fromStepId),
            eq(learnerLessonProgress.status, inProgressStatus)
          )
        )
        .run()
      return
    case "complete-lesson":
      transaction
        .update(learnerLessonProgress)
        .set({
          completedAt: effect.occurredAt,
          status: completedStatus,
          updatedAt: effect.occurredAt,
        })
        .where(
          and(
            eq(learnerLessonProgress.userId, effect.userId),
            eq(
              learnerLessonProgress.curriculumVersionId,
              effect.curriculumVersionId
            ),
            eq(learnerLessonProgress.lessonId, effect.lessonId),
            eq(learnerLessonProgress.currentStepId, effect.finalStepId),
            eq(learnerLessonProgress.status, inProgressStatus)
          )
        )
        .run()
      return
    case "complete-course":
      transaction
        .update(learnerCourseProgress)
        .set({
          completedAt: effect.occurredAt,
          lastActivityAt: effect.occurredAt,
          status: completedStatus,
          updatedAt: effect.occurredAt,
        })
        .where(
          and(
            eq(learnerCourseProgress.userId, effect.userId),
            eq(learnerCourseProgress.courseId, effect.courseId),
            eq(
              learnerCourseProgress.curriculumVersionId,
              effect.curriculumVersionId
            ),
            eq(learnerCourseProgress.status, inProgressStatus)
          )
        )
        .run()
      return
    case "record-learning-activity":
      recordActivity(transaction, effect, effect.userId, effect.occurredAt)
      recordActivityDay(transaction, {
        activityDate: effect.activityDate,
        completedLessons: effect.completedLessons,
        occurredAt: effect.occurredAt,
        savedAnswers: effect.savedAnswers,
        userId: effect.userId,
      })
  }
}

function completeAiFeedbackStep(
  transaction: LearningTransaction,
  command: CompleteLearnerAiFeedbackCommand
): Result<CompleteLearnerStepTransitionResult, LearnerTransitionError> {
  const scope = findPinnedLessonScope(transaction, command)
  if (scope === null) {
    const decision = decideFinalizeAiFeedback(command, {
      kind: "lesson-locked",
    })
    if (decision.kind === "rejected") return err(decision.error)
    throw new Error("Missing lesson scope produced an accepted AI decision")
  }
  const lessons = readOrderedLessons(transaction, scope)
  const steps = readLessonSteps(transaction, scope)
  const progress = readLessonProgress(transaction, command.userId, scope)
  const snapshot: FinalizeAiFeedbackSnapshot = {
    isUnlocked: isLessonUnlocked(transaction, command.userId, scope, lessons),
    kind: "lesson",
    progress: toAiFeedbackProgressSnapshot(progress),
    steps: toAiFeedbackStepSnapshots(steps),
  }
  const decision = decideFinalizeAiFeedback(command, snapshot)
  if (decision.kind === "rejected") return err(decision.error)

  switch (decision.kind) {
    case "replay-completed":
      return ok(readCompletedResult(transaction, command.userId, scope, steps))
    case "replay-advanced":
      return ok({
        evaluation: null,
        kind: "advanced",
        learning: readInProgressState(
          transaction,
          command.userId,
          scope,
          steps
        ),
      })
    case "advance":
      return ok(
        advanceAcceptedStep(transaction, {
          answerWasSaved: false,
          evaluation: null,
          lessonId: command.lessonId,
          occurredAt: command.occurredAt,
          requestedStepIndex: decision.requestedStepIndex,
          scope,
          stepId: command.stepId,
          steps,
          userId: command.userId,
        })
      )
  }
}

function toAiFeedbackStepSnapshots(steps: ReturnType<typeof readLessonSteps>) {
  return steps.map((step) => ({
    content: step.content,
    id: step.content.id,
  }))
}

function toAiFeedbackProgressSnapshot(
  progress: ReturnType<typeof readLessonProgress>
) {
  if (progress === null) return { kind: "not-started" } as const
  return {
    currentStepId: lessonStepIdSchema.parse(progress.currentStepId),
    kind: progress.status === completedStatus ? "completed" : "in-progress",
  } as const
}

function advanceAcceptedStep(
  transaction: LearningTransaction,
  input: {
    readonly answerWasSaved: boolean
    readonly evaluation: CompleteLearnerStepTransitionResult["evaluation"]
    readonly lessonId: CompleteLearnerStepCommand["lessonId"]
    readonly occurredAt: Date
    readonly requestedStepIndex: number
    readonly scope: LessonScope
    readonly stepId: CompleteLearnerStepCommand["stepId"]
    readonly steps: ReturnType<typeof readLessonSteps>
    readonly userId: CompleteLearnerStepCommand["userId"]
  }
): CompleteLearnerStepTransitionResult {
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
    return {
      evaluation: input.evaluation,
      kind: "advanced",
      learning: readInProgressState(
        transaction,
        input.userId,
        input.scope,
        input.steps
      ),
    }
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
  return { ...completed, evaluation: input.evaluation }
}

function findPinnedLessonScope(
  db: TransitionDatabase,
  command: { readonly lessonId: string; readonly userId: string }
): LessonScope | null {
  const row = db
    .select({
      courseId: learnerCourseProgress.courseId,
      curriculumVersionId: learnerCourseProgress.curriculumVersionId,
      lessonId: lessonVersions.id,
      revision: courseCurriculumVersions.revision,
    })
    .from(learnerCourseProgress)
    .innerJoin(
      courseCurriculumVersions,
      eq(courseCurriculumVersions.id, learnerCourseProgress.curriculumVersionId)
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
    .get()
  return row === undefined ? null : toLessonScope(row)
}

function findPublishedLessonScope(
  db: TransitionDatabase,
  lessonId: string
): LessonScope | null {
  const row = db
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
    .get()
  return row === undefined ? null : toLessonScope(row)
}

function toLessonScope(input: {
  readonly courseId: string
  readonly curriculumVersionId: string
  readonly lessonId: string
  readonly revision: number
}): LessonScope {
  return {
    courseId: courseIdSchema.parse(input.courseId),
    curriculumVersionId: curriculumVersionIdSchema.parse(
      input.curriculumVersionId
    ),
    lessonId: lessonIdSchema.parse(input.lessonId),
    revision: input.revision,
  }
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
  const completedLessonIds = new Set<string>(
    readCompletedLessonIds(db, userId, scope)
  )
  return lessons
    .slice(0, lessonIndex)
    .every((lesson) => completedLessonIds.has(lesson.id))
}

function readCompletedLessonIds(
  db: TransitionDatabase,
  userId: string,
  scope: LessonScope
): readonly LessonId[] {
  return db
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
    .map((row) => lessonIdSchema.parse(row.id))
}

function readCourseCompletionLessonIds(
  db: TransitionDatabase,
  scope: LessonScope
): readonly LessonId[] {
  return db
    .select({ id: lessonVersions.id })
    .from(lessonVersions)
    .where(
      and(
        eq(lessonVersions.curriculumVersionId, scope.curriculumVersionId),
        eq(lessonVersions.status, activeStatus)
      )
    )
    .all()
    .map((row) => lessonIdSchema.parse(row.id))
}

function readLessonStepIds(
  db: TransitionDatabase,
  scope: LessonScope
): readonly LessonStepId[] {
  return db
    .select({ id: lessonStepVersions.id })
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
    .map((row) => lessonStepIdSchema.parse(row.id))
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

function hasSavedAnswer(
  db: TransitionDatabase,
  command: CompleteLearnerStepCommand,
  scope: LessonScope
): boolean {
  return (
    db
      .select({ stepId: learnerLessonAnswers.stepId })
      .from(learnerLessonAnswers)
      .where(
        and(
          eq(learnerLessonAnswers.userId, command.userId),
          eq(
            learnerLessonAnswers.curriculumVersionId,
            scope.curriculumVersionId
          ),
          eq(learnerLessonAnswers.stepId, command.stepId)
        )
      )
      .get() !== undefined
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

function readCompletedResult(
  db: TransitionDatabase,
  userId: string,
  scope: LessonScope,
  steps: readonly { readonly id: string }[]
): Extract<
  CompleteLearnerStepTransitionResult,
  { readonly kind: "lesson-completed" }
> {
  const learning = readLessonLearningState(db, userId, scope, steps)
  if (learning.status !== completedStatus) {
    throw new Error("Lesson completion was not stored")
  }
  return {
    courseLearning: readCourseLearningState(db, userId, scope),
    evaluation: null,
    kind: "lesson-completed",
    lessonCompletion: learning.completion,
  }
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
    activityDate: toLearningDateKey(command.occurredAt),
    completedLessons: lessonWasCompleted ? 1 : 0,
    occurredAt: command.occurredAt,
    savedAnswers: answerWasSaved ? 1 : 0,
    userId: command.userId,
  })
}

function recordActivity(
  transaction: LearningTransaction,
  scope: Pick<LessonScope, "courseId" | "curriculumVersionId">,
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
    readonly activityDate: LearningDateKey
    readonly completedLessons: number
    readonly occurredAt: Date
    readonly savedAnswers: number
    readonly userId: string
  }
): void {
  transaction
    .insert(learnerActivityDays)
    .values({
      activityDate: input.activityDate,
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
