import {
  makePushTransactionsUseCase,
  makePullDocumentUseCase,
  makeListVersionsUseCase,
  makeGetVersionUseCase,
  type WritingRepository,
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
  type DraftId,
  type DomainError,
  type UserId,
} from "@workspace/core"
import type { Result } from "neverthrow"

export type WritingApiService = {
  pushTransactions: (
    userId: UserId,
    draftId: DraftId,
    input: SyncPushInput
  ) => Promise<SyncPushResult>
  pullDocument: (
    userId: UserId,
    draftId: DraftId,
    sinceVersion?: number
  ) => Promise<SyncPullResult>
  listVersions: (
    userId: UserId,
    draftId: DraftId,
    limit?: number
  ) => Promise<readonly WritingVersionSummary[]>
  getVersion: (
    userId: UserId,
    draftId: DraftId,
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

export function createWritingApiService(input: {
  writingRepository: WritingRepository
  transactionRepository: WritingTransactionRepository
  versionRepository: WritingVersionRepository
  getNow?: () => string
}): WritingApiService {
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
    async pushTransactions(userId, draftId, pushInput) {
      return unwrapOrThrow(await pushTransactions(userId, draftId, pushInput))
    },
    async pullDocument(userId, draftId, sinceVersion) {
      return unwrapOrThrow(await pullDocument(userId, draftId, sinceVersion))
    },
    async listVersions(userId, draftId, limit) {
      return unwrapOrThrow(await listVersions(userId, draftId, limit))
    },
    async getVersion(userId, draftId, version) {
      return unwrapOrThrow(await getVersion(userId, draftId, version))
    },
  }
}
