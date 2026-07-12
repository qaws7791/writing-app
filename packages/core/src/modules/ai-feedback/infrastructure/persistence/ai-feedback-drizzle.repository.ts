import { and, count, eq, inArray, lte } from "drizzle-orm"

import type { AiFeedbackRepository } from "#core/modules/ai-feedback/application/ports/ai-feedback.repository"
import { aiFeedbackPayloadSchema } from "#core/modules/ai-feedback/domain/ai-feedback.dto"
import type { WritingAppDatabase } from "@workspace/db/client"
import { aiFeedbackAttempts } from "@workspace/db/schema"

export function createDrizzleAiFeedbackRepository(
  db: WritingAppDatabase
): AiFeedbackRepository {
  return {
    async reserveAttempt(input) {
      return db.transaction(
        (tx) => {
          const scope = and(
            eq(aiFeedbackAttempts.userId, input.userId),
            eq(aiFeedbackAttempts.lessonId, input.lessonId),
            eq(aiFeedbackAttempts.stepId, input.stepId)
          )
          const expiredAttempts = tx
            .update(aiFeedbackAttempts)
            .set({
              status: "expired",
              updatedAt: input.occurredAt,
            })
            .where(
              and(
                scope,
                eq(aiFeedbackAttempts.status, "pending"),
                lte(aiFeedbackAttempts.expiresAt, input.occurredAt)
              )
            )
            .returning({
              attemptId: aiFeedbackAttempts.id,
              attemptNumber: aiFeedbackAttempts.attemptNumber,
            })
            .all()

          const existingAttempt = tx
            .select({
              attemptNumber: aiFeedbackAttempts.attemptNumber,
              resultJson: aiFeedbackAttempts.resultJson,
              status: aiFeedbackAttempts.status,
            })
            .from(aiFeedbackAttempts)
            .where(
              and(
                scope,
                eq(aiFeedbackAttempts.idempotencyKey, input.idempotencyKey)
              )
            )
            .get()
          const completedAttempts = countSucceededAttempts(tx, scope)
          const metadata = { completedAttempts, expiredAttempts } as const

          if (existingAttempt?.status === "succeeded") {
            return {
              ...metadata,
              attemptNumber: existingAttempt.attemptNumber,
              kind: "already-succeeded",
              result: aiFeedbackPayloadSchema.parse(
                JSON.parse(existingAttempt.resultJson ?? "null")
              ),
            } as const
          }

          if (
            existingAttempt?.status === "failed" ||
            existingAttempt?.status === "expired"
          ) {
            return { ...metadata, kind: "already-failed" } as const
          }

          if (existingAttempt?.status === "pending") {
            return { ...metadata, kind: "in-progress" } as const
          }

          if (completedAttempts >= input.maxCompletedAttempts) {
            return { ...metadata, kind: "limit-exceeded" } as const
          }

          const pendingAttempt = tx
            .select({ id: aiFeedbackAttempts.id })
            .from(aiFeedbackAttempts)
            .where(and(scope, eq(aiFeedbackAttempts.status, "pending")))
            .get()

          if (pendingAttempt !== undefined) {
            return { ...metadata, kind: "in-progress" } as const
          }

          const activeAttemptNumbers = new Set(
            tx
              .select({ attemptNumber: aiFeedbackAttempts.attemptNumber })
              .from(aiFeedbackAttempts)
              .where(
                and(
                  scope,
                  inArray(aiFeedbackAttempts.status, ["pending", "succeeded"])
                )
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

          tx.insert(aiFeedbackAttempts)
            .values({
              answerText: input.answer,
              attemptNumber,
              createdAt: input.occurredAt,
              expiresAt: input.expiresAt,
              id: input.attemptId,
              idempotencyKey: input.idempotencyKey,
              lessonId: input.lessonId,
              resultJson: null,
              status: "pending",
              stepId: input.stepId,
              updatedAt: input.occurredAt,
              userId: input.userId,
            })
            .run()

          return {
            ...metadata,
            attemptId: input.attemptId,
            attemptNumber,
            kind: "reserved",
          } as const
        },
        { behavior: "immediate" }
      )
    },
    async markAttemptFailed(input) {
      const updatedAttempt = db
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

      return updatedAttempt !== undefined
    },
    async markAttemptSucceeded(input) {
      const updatedAttempt = db
        .update(aiFeedbackAttempts)
        .set({
          resultJson: JSON.stringify(input.result),
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

      return updatedAttempt !== undefined
    },
  }
}

function countSucceededAttempts(
  tx: Parameters<Parameters<WritingAppDatabase["transaction"]>[0]>[0],
  scope: ReturnType<typeof and>
): number {
  return (
    tx
      .select({ value: count() })
      .from(aiFeedbackAttempts)
      .where(and(scope, eq(aiFeedbackAttempts.status, "succeeded")))
      .get()?.value ?? 0
  )
}
