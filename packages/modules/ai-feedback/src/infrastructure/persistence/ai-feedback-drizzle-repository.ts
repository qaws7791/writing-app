import { and, count, eq, gt, inArray, lte, sql } from "drizzle-orm"
import { err, ok } from "@workspace/kernel/result"
import type { WritingAppDatabase } from "@workspace/db/client"

import { validateStoredAiFeedback } from "#ai-feedback/infrastructure/persistence/stored-ai-feedback"
import { createAiFeedbackAttemptId } from "#ai-feedback/domain/ai-feedback-attempt"
import type {
  AiFeedbackAttemptScope,
  AiFeedbackPersistenceError,
  AiFeedbackRepository,
} from "#ai-feedback/application/ports/ai-feedback-repository"
import {
  aiFeedbackAttempts,
  aiFeedbackGlobalDailyCounters,
  aiFeedbackUserDailyCounters,
} from "#ai-feedback/infrastructure/persistence/schema"

type AiFeedbackTransaction = Parameters<
  Parameters<WritingAppDatabase["transaction"]>[0]
>[0]

export function createDrizzleAiFeedbackRepository(
  database: WritingAppDatabase
): AiFeedbackRepository {
  return {
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
          .set({
            failureCode: input.failureCode,
            inputTokenCount: input.inputTokenCount ?? null,
            latencyMs: input.latencyMs,
            outputTokenCount: input.outputTokenCount ?? null,
            status: "failed",
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
        return ok({
          kind: updated === undefined ? "not-pending" : "transitioned",
        })
      } catch (cause) {
        return err(persistenceError("fail-attempt", cause))
      }
    },
    async markAttemptSucceeded(input) {
      try {
        return ok(
          database.transaction(
            (transaction) => markAttemptSucceeded(transaction, input),
            { behavior: "immediate" }
          )
        )
      } catch (cause) {
        return err(persistenceError("succeed-attempt", cause))
      }
    },
  }
}

function reserveAttempt(
  transaction: AiFeedbackTransaction,
  input: Parameters<AiFeedbackRepository["reserveAttempt"]>[0]
) {
  const scope = attemptScope(input)
  const expiredAttempts = transaction
    .update(aiFeedbackAttempts)
    .set({
      failureCode: "pending-expired",
      latencyMs: sql`${aiFeedbackAttempts.expiresAt} - ${aiFeedbackAttempts.createdAt}`,
      status: "expired",
      updatedAt: input.createdAt,
    })
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
      failureCode: aiFeedbackAttempts.failureCode,
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
    if (existingAttempt.failureCode === null) {
      throw new Error("Terminal AI feedback attempt has no failure code")
    }
    return {
      ...metadata,
      failureCode: existingAttempt.failureCode,
      kind: "already-failed",
    } as const
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

  if (isDailyQuotaExceeded(transaction, input)) {
    return {
      ...metadata,
      kind: "daily-quota-exceeded",
      retryAfterSeconds: input.quotaRetryAfterSeconds,
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
      inputTokenCount: null,
      latencyMs: null,
      lessonId: input.lessonId,
      model: input.model,
      outputTokenCount: null,
      promptPolicyVersion: input.promptPolicyVersion,
      quotaDate: input.quotaDate,
      resultJson: null,
      failureCode: null,
      status: "pending",
      stepId: input.stepId,
      updatedAt: input.createdAt,
      userId: input.learnerId,
    })
    .run()
  incrementDailyRequestCounters(transaction, input)

  return {
    ...metadata,
    attemptId: input.attemptId,
    attemptNumber,
    kind: "reserved",
  } as const
}

function markAttemptSucceeded(
  transaction: AiFeedbackTransaction,
  input: Parameters<AiFeedbackRepository["markAttemptSucceeded"]>[0]
) {
  const updated = transaction
    .update(aiFeedbackAttempts)
    .set({
      failureCode: null,
      inputTokenCount: input.inputTokenCount ?? null,
      latencyMs: input.latencyMs,
      outputTokenCount: input.outputTokenCount ?? null,
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
    .returning({
      quotaDate: aiFeedbackAttempts.quotaDate,
      userId: aiFeedbackAttempts.userId,
    })
    .get()

  if (updated === undefined) return { kind: "not-pending" } as const

  incrementDailySuccessCounters(transaction, {
    occurredAt: input.occurredAt,
    quotaDate: updated.quotaDate,
    userId: updated.userId,
  })
  return { kind: "transitioned" } as const
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

function isDailyQuotaExceeded(
  transaction: AiFeedbackTransaction,
  input: Parameters<AiFeedbackRepository["reserveAttempt"]>[0]
): boolean {
  const userCounter = transaction
    .select({
      requestCount: aiFeedbackUserDailyCounters.requestCount,
      successCount: aiFeedbackUserDailyCounters.successCount,
    })
    .from(aiFeedbackUserDailyCounters)
    .where(
      and(
        eq(aiFeedbackUserDailyCounters.userId, input.learnerId),
        eq(aiFeedbackUserDailyCounters.quotaDate, input.quotaDate)
      )
    )
    .get()
  const globalCounter = transaction
    .select({
      requestCount: aiFeedbackGlobalDailyCounters.requestCount,
      successCount: aiFeedbackGlobalDailyCounters.successCount,
    })
    .from(aiFeedbackGlobalDailyCounters)
    .where(eq(aiFeedbackGlobalDailyCounters.quotaDate, input.quotaDate))
    .get()
  const userPending = countPendingAttempts(transaction, {
    createdAt: input.createdAt,
    quotaDate: input.quotaDate,
    userId: input.learnerId,
  })
  const globalPending = countPendingAttempts(transaction, {
    createdAt: input.createdAt,
    quotaDate: input.quotaDate,
  })

  return (
    (userCounter?.requestCount ?? 0) >=
      input.quotaPolicy.userDailyRequestLimit ||
    (globalCounter?.requestCount ?? 0) >=
      input.quotaPolicy.globalDailyRequestLimit ||
    (userCounter?.successCount ?? 0) + userPending >=
      input.quotaPolicy.userDailySuccessLimit ||
    (globalCounter?.successCount ?? 0) + globalPending >=
      input.quotaPolicy.globalDailySuccessLimit
  )
}

function countPendingAttempts(
  transaction: AiFeedbackTransaction,
  input: Readonly<{ createdAt: Date; quotaDate: string; userId?: string }>
): number {
  return (
    transaction
      .select({ value: count() })
      .from(aiFeedbackAttempts)
      .where(
        and(
          eq(aiFeedbackAttempts.quotaDate, input.quotaDate),
          eq(aiFeedbackAttempts.status, "pending"),
          gt(aiFeedbackAttempts.expiresAt, input.createdAt),
          ...(input.userId === undefined
            ? []
            : [eq(aiFeedbackAttempts.userId, input.userId)])
        )
      )
      .get()?.value ?? 0
  )
}

function incrementDailyRequestCounters(
  transaction: AiFeedbackTransaction,
  input: Parameters<AiFeedbackRepository["reserveAttempt"]>[0]
): void {
  transaction
    .insert(aiFeedbackUserDailyCounters)
    .values({
      quotaDate: input.quotaDate,
      requestCount: 1,
      successCount: 0,
      updatedAt: input.createdAt,
      userId: input.learnerId,
    })
    .onConflictDoUpdate({
      set: {
        requestCount: sql`${aiFeedbackUserDailyCounters.requestCount} + 1`,
        updatedAt: input.createdAt,
      },
      target: [
        aiFeedbackUserDailyCounters.userId,
        aiFeedbackUserDailyCounters.quotaDate,
      ],
    })
    .run()
  transaction
    .insert(aiFeedbackGlobalDailyCounters)
    .values({
      quotaDate: input.quotaDate,
      requestCount: 1,
      successCount: 0,
      updatedAt: input.createdAt,
    })
    .onConflictDoUpdate({
      set: {
        requestCount: sql`${aiFeedbackGlobalDailyCounters.requestCount} + 1`,
        updatedAt: input.createdAt,
      },
      target: aiFeedbackGlobalDailyCounters.quotaDate,
    })
    .run()
}

function incrementDailySuccessCounters(
  transaction: AiFeedbackTransaction,
  input: Readonly<{
    occurredAt: Date
    quotaDate: string
    userId: string
  }>
): void {
  const userCounter = transaction
    .update(aiFeedbackUserDailyCounters)
    .set({
      successCount: sql`${aiFeedbackUserDailyCounters.successCount} + 1`,
      updatedAt: input.occurredAt,
    })
    .where(
      and(
        eq(aiFeedbackUserDailyCounters.userId, input.userId),
        eq(aiFeedbackUserDailyCounters.quotaDate, input.quotaDate)
      )
    )
    .returning({ userId: aiFeedbackUserDailyCounters.userId })
    .get()
  const globalCounter = transaction
    .update(aiFeedbackGlobalDailyCounters)
    .set({
      successCount: sql`${aiFeedbackGlobalDailyCounters.successCount} + 1`,
      updatedAt: input.occurredAt,
    })
    .where(eq(aiFeedbackGlobalDailyCounters.quotaDate, input.quotaDate))
    .returning({ quotaDate: aiFeedbackGlobalDailyCounters.quotaDate })
    .get()

  if (userCounter === undefined || globalCounter === undefined) {
    throw new Error("AI feedback daily counter is missing")
  }
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
