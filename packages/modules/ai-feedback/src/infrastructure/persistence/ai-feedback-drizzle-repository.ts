import { and, count, eq, inArray, lte } from "drizzle-orm"
import { err, ok } from "@workspace/kernel/result"
import type { WritingAppDatabase } from "@workspace/db/client"

import { validateStoredAiFeedback } from "#ai-feedback/infrastructure/persistence/stored-ai-feedback"
import { createAiFeedbackAttemptId } from "#ai-feedback/domain/ai-feedback-attempt"
import type {
  AiFeedbackAttemptScope,
  AiFeedbackPersistenceError,
  AiFeedbackRepository,
} from "#ai-feedback/application/ports/ai-feedback-repository"
import { aiFeedbackAttempts } from "#ai-feedback/infrastructure/persistence/schema"

type AiFeedbackTransaction = Parameters<
  Parameters<WritingAppDatabase["transaction"]>[0]
>[0]

export function createDrizzleAiFeedbackRepository(
  database: WritingAppDatabase
): AiFeedbackRepository {
  return Object.freeze({
    async reserveAttempt(input) {
      try {
        return ok(
          database.transaction(
            (transaction) => reserveAttempt(transaction, input),
            { behavior: "immediate" }
          )
        )
      } catch (cause) {
        return err(persistenceError("reserve-attempt", cause))
      }
    },
    async markAttemptFailed(input) {
      try {
        const updated = database
          .update(aiFeedbackAttempts)
          .set({ status: "failed", updatedAt: input.occurredAt })
          .where(
            and(
              eq(aiFeedbackAttempts.id, input.attemptId),
              eq(aiFeedbackAttempts.status, "pending")
            )
          )
          .returning({ id: aiFeedbackAttempts.id })
          .get()
        return ok(updated !== undefined)
      } catch (cause) {
        return err(persistenceError("fail-attempt", cause))
      }
    },
    async markAttemptSucceeded(input) {
      try {
        const updated = database
          .update(aiFeedbackAttempts)
          .set({
            resultJson: JSON.stringify(input.feedback),
            status: "succeeded",
            updatedAt: input.occurredAt,
          })
          .where(
            and(
              eq(aiFeedbackAttempts.id, input.attemptId),
              eq(aiFeedbackAttempts.status, "pending")
            )
          )
          .returning({ id: aiFeedbackAttempts.id })
          .get()
        return ok(updated !== undefined)
      } catch (cause) {
        return err(persistenceError("succeed-attempt", cause))
      }
    },
  })
}

function reserveAttempt(
  transaction: AiFeedbackTransaction,
  input: Parameters<AiFeedbackRepository["reserveAttempt"]>[0]
) {
  const scope = attemptScope(input)
  const expiredAttempts = transaction
    .update(aiFeedbackAttempts)
    .set({ status: "expired", updatedAt: input.createdAt })
    .where(
      and(
        scope,
        eq(aiFeedbackAttempts.status, "pending"),
        lte(aiFeedbackAttempts.expiresAt, input.createdAt)
      )
    )
    .returning({
      attemptId: aiFeedbackAttempts.id,
      attemptNumber: aiFeedbackAttempts.attemptNumber,
    })
    .all()
    .map((attempt) => ({
      ...attempt,
      attemptId: createAiFeedbackAttemptId(attempt.attemptId),
    }))
  const existingAttempt = transaction
    .select({
      attemptId: aiFeedbackAttempts.id,
      attemptNumber: aiFeedbackAttempts.attemptNumber,
      expiresAt: aiFeedbackAttempts.expiresAt,
      resultJson: aiFeedbackAttempts.resultJson,
      status: aiFeedbackAttempts.status,
    })
    .from(aiFeedbackAttempts)
    .where(
      and(scope, eq(aiFeedbackAttempts.idempotencyKey, input.idempotencyKey))
    )
    .get()
  const completedAttempts = countSucceededAttempts(transaction, scope)
  const metadata = { completedAttempts, expiredAttempts } as const

  if (existingAttempt?.status === "succeeded") {
    return {
      ...metadata,
      attemptId: createAiFeedbackAttemptId(existingAttempt.attemptId),
      attemptNumber: existingAttempt.attemptNumber,
      feedback: validateStoredAiFeedback(existingAttempt.resultJson),
      kind: "already-succeeded",
    } as const
  }
  if (
    existingAttempt?.status === "failed" ||
    existingAttempt?.status === "expired"
  ) {
    return { ...metadata, kind: "already-failed" } as const
  }
  if (existingAttempt?.status === "pending") {
    return {
      ...metadata,
      kind: "in-progress",
      retryAfterSeconds: retryAfterSeconds(
        existingAttempt.expiresAt,
        input.createdAt
      ),
    } as const
  }
  if (completedAttempts >= input.maxCompletedAttempts) {
    return { ...metadata, kind: "limit-exceeded" } as const
  }

  const pendingAttempt = transaction
    .select({ expiresAt: aiFeedbackAttempts.expiresAt })
    .from(aiFeedbackAttempts)
    .where(and(scope, eq(aiFeedbackAttempts.status, "pending")))
    .get()
  if (pendingAttempt !== undefined) {
    return {
      ...metadata,
      kind: "in-progress",
      retryAfterSeconds: retryAfterSeconds(
        pendingAttempt.expiresAt,
        input.createdAt
      ),
    } as const
  }

  const activeAttemptNumbers = new Set(
    transaction
      .select({ attemptNumber: aiFeedbackAttempts.attemptNumber })
      .from(aiFeedbackAttempts)
      .where(
        and(scope, inArray(aiFeedbackAttempts.status, ["pending", "succeeded"]))
      )
      .all()
      .map((attempt) => attempt.attemptNumber)
  )
  const attemptNumber = Array.from(
    { length: input.maxCompletedAttempts },
    (_, index) => index + 1
  ).find((slot) => !activeAttemptNumbers.has(slot))
  if (attemptNumber === undefined) {
    return { ...metadata, kind: "limit-exceeded" } as const
  }

  transaction
    .insert(aiFeedbackAttempts)
    .values({
      answerText: input.answer,
      attemptNumber,
      courseId: input.courseId,
      createdAt: input.createdAt,
      curriculumVersionId: input.curriculumVersionId,
      expiresAt: input.expiresAt,
      id: input.attemptId,
      idempotencyKey: input.idempotencyKey,
      lessonId: input.lessonId,
      resultJson: null,
      status: "pending",
      stepId: input.stepId,
      updatedAt: input.createdAt,
      userId: input.learnerId,
    })
    .run()

  return {
    ...metadata,
    attemptId: input.attemptId,
    attemptNumber,
    kind: "reserved",
  } as const
}

function attemptScope(input: AiFeedbackAttemptScope) {
  return and(
    eq(aiFeedbackAttempts.userId, input.learnerId),
    eq(aiFeedbackAttempts.curriculumVersionId, input.curriculumVersionId),
    eq(aiFeedbackAttempts.lessonId, input.lessonId),
    eq(aiFeedbackAttempts.stepId, input.stepId)
  )
}

function countSucceededAttempts(
  transaction: AiFeedbackTransaction,
  scope: ReturnType<typeof and>
): number {
  return (
    transaction
      .select({ value: count() })
      .from(aiFeedbackAttempts)
      .where(and(scope, eq(aiFeedbackAttempts.status, "succeeded")))
      .get()?.value ?? 0
  )
}

function retryAfterSeconds(expiresAt: Date, now: Date): number {
  return Math.max(1, Math.ceil((expiresAt.getTime() - now.getTime()) / 1_000))
}

function persistenceError(
  operation: AiFeedbackPersistenceError["operation"],
  cause: unknown
): AiFeedbackPersistenceError {
  return { cause, kind: "ai-feedback-persistence-failed", operation }
}
