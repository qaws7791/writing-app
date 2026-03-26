import {
  makePushTransactionsUseCase,
  makePullDocumentUseCase,
  makeListVersionsUseCase,
  makeGetVersionUseCase,
  type WritingSyncRepository,
  type WritingTransactionRepository,
  type WritingVersionRepository,
  type SyncPushInput,
  type SyncPushResult,
  type SyncPullResult,
  type WritingVersionSummary,
  type WritingVersionDetail,
} from "@workspace/core/modules/writings"
import {
  toApplicationError,
  type WritingId,
  type DomainError,
  type UserId,
} from "@workspace/core"
import type { Result } from "neverthrow"

export type WritingSyncApiService = {
  pushTransactions: (
    userId: UserId,
    writingId: WritingId,
    input: SyncPushInput
  ) => Promise<SyncPushResult>
  pullDocument: (
    userId: UserId,
    writingId: WritingId,
    sinceVersion?: number
  ) => Promise<SyncPullResult>
  listVersions: (
    userId: UserId,
    writingId: WritingId,
    limit?: number
  ) => Promise<readonly WritingVersionSummary[]>
  getVersion: (
    userId: UserId,
    writingId: WritingId,
    version: number
  ) => Promise<WritingVersionDetail>
}

function unwrapOrThrow<TValue, TError extends DomainError>(
  result: Result<TValue, TError>
): TValue {
  if (result.isErr()) {
    throw toApplicationError(result.error)
  }

  return result.value
}

export function createWritingSyncApiService(input: {
  writingRepository: WritingSyncRepository
  transactionRepository: WritingTransactionRepository
  versionRepository: WritingVersionRepository
  getNow?: () => string
}): WritingSyncApiService {
  const pushTransactions = makePushTransactionsUseCase({
    writingRepository: input.writingRepository,
    transactionRepository: input.transactionRepository,
    versionRepository: input.versionRepository,
    getNow: input.getNow ?? (() => new Date().toISOString()),
  })

  const pullDocument = makePullDocumentUseCase({
    writingRepository: input.writingRepository,
  })

  const listVersions = makeListVersionsUseCase({
    writingRepository: input.writingRepository,
    versionRepository: input.versionRepository,
  })

  const getVersion = makeGetVersionUseCase({
    writingRepository: input.writingRepository,
    versionRepository: input.versionRepository,
  })

  return {
    async pushTransactions(userId, writingId, pushInput) {
      return unwrapOrThrow(await pushTransactions(userId, writingId, pushInput))
    },
    async pullDocument(userId, writingId, sinceVersion) {
      return unwrapOrThrow(await pullDocument(userId, writingId, sinceVersion))
    },
    async listVersions(userId, writingId, limit) {
      return unwrapOrThrow(await listVersions(userId, writingId, limit))
    },
    async getVersion(userId, writingId, version) {
      return unwrapOrThrow(await getVersion(userId, writingId, version))
    },
  }
}
