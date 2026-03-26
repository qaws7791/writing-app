import { err, ok, ResultAsync } from "neverthrow"
import { match } from "ts-pattern"

import type { WritingId, UserId } from "../../../shared/brand/index"
import type { WritingSyncRepository, WritingSyncWriter } from "../writing-port"
import {
  applyOperationsToContent,
  computeWritingMetrics,
} from "../writing-operations"
import {
  writingForbidden,
  writingNotFound,
  writingValidationFailed,
  type WritingModuleError,
} from "../writing-error"
import type {
  PushWritePlan,
  PushWritePlanTransaction,
  SyncPushInput,
  SyncPushResult,
} from "../writing-types"

export type PushTransactionsDeps = {
  readonly writingRepository: WritingSyncRepository
  readonly syncWriter: WritingSyncWriter
  readonly getNow: () => string
}

const VERSION_SNAPSHOT_INTERVAL = 10

export function makePushTransactionsUseCase(deps: PushTransactionsDeps) {
  return (
    userId: UserId,
    writingId: WritingId,
    input: SyncPushInput
  ): ResultAsync<SyncPushResult, WritingModuleError> => {
    if (input.transactions.length === 0) {
      return ResultAsync.fromSafePromise(
        Promise.resolve(
          err(writingValidationFailed("트랜잭션이 비어있습니다."))
        )
      ).andThen((r) => r)
    }

    return ResultAsync.fromSafePromise(
      deps.writingRepository.getById(userId, writingId)
    ).andThen((access) =>
      match(access)
        .with({ kind: "not-found" }, () =>
          err(writingNotFound("문서를 찾을 수 없습니다.", writingId))
        )
        .with({ kind: "forbidden" }, ({ ownerId }) =>
          err(
            writingForbidden(
              "다른 사용자의 문서에는 접근할 수 없습니다.",
              ownerId
            )
          )
        )
        .with({ kind: "writing" }, ({ writing }) => {
          if (input.baseVersion !== writing.version) {
            return ok<SyncPushResult, WritingModuleError>({
              accepted: false,
              serverVersion: writing.version,
              serverContent: writing.content,
              serverTitle: writing.title,
            })
          }

          const now = deps.getNow()
          let currentContent = writing.content
          let currentTitle = writing.title
          let nextVersion = writing.version

          const plannedTransactions: PushWritePlanTransaction[] = []

          for (const tx of input.transactions) {
            const applied = applyOperationsToContent(
              currentContent,
              currentTitle,
              tx.operations
            )
            currentContent = applied.content
            currentTitle = applied.title
            nextVersion += 1

            plannedTransactions.push({
              writingId,
              userId,
              version: nextVersion,
              operations: tx.operations,
              createdAt: tx.createdAt,
            })
          }

          const metrics = computeWritingMetrics(currentContent)

          const shouldSnapshot =
            nextVersion % VERSION_SNAPSHOT_INTERVAL === 0 ||
            input.restoreFrom !== undefined ||
            input.snapshotReason === "manual"

          const plan: PushWritePlan = {
            transactions: plannedTransactions,
            writing: {
              userId,
              writingId,
              content: currentContent,
              title: currentTitle,
              plainText: metrics.plainText,
              characterCount: metrics.characterCount,
              wordCount: metrics.wordCount,
              version: nextVersion,
            },
            versionSnapshot: shouldSnapshot
              ? {
                  writingId,
                  userId,
                  version: nextVersion,
                  title: currentTitle,
                  content: currentContent,
                  createdAt: now,
                  reason:
                    input.restoreFrom !== undefined
                      ? "restore"
                      : input.snapshotReason === "manual"
                        ? "manual"
                        : "auto",
                }
              : undefined,
          }

          return ResultAsync.fromSafePromise(
            deps.syncWriter.persistPush(plan).then((result) => {
              if (result.kind === "version-conflict") {
                return {
                  accepted: false as const,
                  serverVersion: result.currentVersion,
                  serverContent: writing.content,
                  serverTitle: writing.title,
                }
              }

              if (result.kind === "not-found") {
                throw new Error("문서 업데이트 후 찾을 수 없습니다.")
              }

              if (result.kind === "forbidden") {
                throw new Error("문서 업데이트 중 권한 오류가 발생했습니다.")
              }

              return {
                accepted: true as const,
                serverVersion: nextVersion,
              }
            })
          ) as ResultAsync<SyncPushResult, WritingModuleError>
        })
        .exhaustive()
    )
  }
}
