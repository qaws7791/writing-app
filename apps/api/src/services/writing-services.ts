import {
  makeAutosaveWritingUseCase,
  makeCreateWritingUseCase,
  makeDeleteWritingUseCase,
  makeGetWritingUseCase,
  makeListWritingsUseCase,
  makePushTransactionsUseCase,
  makePullDocumentUseCase,
  makeListVersionsUseCase,
  makeGetVersionUseCase,
  type AutosaveWritingInput,
  type WritingDetail,
  type WritingRepository,
  type WritingSummary,
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
  type PromptId,
  type PromptRepository,
  type UserId,
  type WritingId,
} from "@workspace/core"
import { unwrapOrThrow } from "../http/unwrap-or-throw"

export type WritingApiService = {
  autosaveWriting: (
    userId: UserId,
    writingId: WritingId,
    input: AutosaveWritingInput
  ) => Promise<{
    writing: WritingDetail
    kind: "autosaved"
  }>
  createWriting: (
    userId: UserId,
    input: {
      content?: AutosaveWritingInput["content"]
      sourcePromptId?: PromptId
      title?: string
    }
  ) => Promise<WritingDetail>
  deleteWriting: (userId: UserId, writingId: WritingId) => Promise<void>
  getWriting: (userId: UserId, writingId: WritingId) => Promise<WritingDetail>
  listWritings: (
    userId: UserId,
    params?: CursorPageParams
  ) => Promise<CursorPage<WritingSummary>>
}

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

export function createWritingApiService(input: {
  writingRepository: WritingRepository
  getNow?: () => string
  promptRepository: Pick<PromptRepository, "exists">
}): WritingApiService {
  const createWriting = makeCreateWritingUseCase({
    writingRepository: input.writingRepository,
    promptExists: (promptId: PromptId) =>
      input.promptRepository.exists(promptId),
  })
  const autosaveWriting = makeAutosaveWritingUseCase({
    writingRepository: input.writingRepository,
    getNow: input.getNow ?? (() => new Date().toISOString()),
  })
  const deleteWriting = makeDeleteWritingUseCase({
    writingRepository: input.writingRepository,
  })
  const getWriting = makeGetWritingUseCase({
    writingRepository: input.writingRepository,
  })
  const listWritings = makeListWritingsUseCase({
    writingRepository: input.writingRepository,
  })

  return {
    async autosaveWriting(userId, writingId, autosaveInput) {
      const writing = unwrapOrThrow(
        await autosaveWriting(userId, writingId, autosaveInput)
      )

      return {
        writing,
        kind: "autosaved",
      }
    },
    async createWriting(userId, createInput) {
      return unwrapOrThrow(await createWriting(userId, createInput))
    },
    async deleteWriting(userId, writingId) {
      unwrapOrThrow(await deleteWriting(userId, writingId))
    },
    async getWriting(userId, writingId) {
      return unwrapOrThrow(await getWriting(userId, writingId))
    },
    async listWritings(userId, params) {
      return unwrapOrThrow(await listWritings(userId, params))
    },
  }
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
