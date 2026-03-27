import {
  makePushTransactionsUseCase,
  makePullDocumentUseCase,
  makeListVersionsUseCase,
  makeGetVersionUseCase,
  type WritingSyncRepository,
  type WritingSyncWriter,
  type WritingTransactionRepository,
  type WritingVersionRepository,
  type SyncPushInput,
  type SyncPushResult,
  type SyncPullResult,
  type WritingVersionSummary,
  type WritingVersionDetail,
} from "@workspace/core/modules/writings"
import {
  type CursorPage,
  type CursorPageParams,
  type WritingId,
  type UserId,
} from "@workspace/core"
import { unwrapOrThrow } from "./http/unwrap-or-throw"

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
    params?: CursorPageParams
  ) => Promise<CursorPage<WritingVersionSummary>>
  getVersion: (
    userId: UserId,
    writingId: WritingId,
    version: number
  ) => Promise<WritingVersionDetail>
}

export function createWritingSyncApiService(input: {
  writingRepository: WritingSyncRepository
  syncWriter: WritingSyncWriter
  transactionRepository: WritingTransactionRepository
  versionRepository: WritingVersionRepository
  getNow?: () => string
}): WritingSyncApiService {
  const pushTransactions = makePushTransactionsUseCase({
    writingRepository: input.writingRepository,
    syncWriter: input.syncWriter,
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
    async listVersions(userId, writingId, params) {
      return unwrapOrThrow(await listVersions(userId, writingId, params))
    },
    async getVersion(userId, writingId, version) {
      return unwrapOrThrow(await getVersion(userId, writingId, version))
    },
  }
}
