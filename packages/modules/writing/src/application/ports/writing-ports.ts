import type { Result } from "@workspace/kernel/result"
import type {
  LearnerId,
  WritingCheckId,
  WritingId,
  WritingTaskId,
  WritingTaskPublicationId,
} from "@workspace/types/ids"
import type {
  WritingDifficulty,
  WritingDomain,
} from "@workspace/contracts/writing/writing"

import type { WritingCheckResult } from "#writing/domain/writing-check"
import type { WritingEventType, WritingPiece } from "#writing/domain/writing"
import type {
  WritingTaskDraft,
  WritingTaskPublication,
} from "#writing/domain/writing-task"

type WritingPersistenceError =
  | Readonly<{ kind: "writing-not-found" }>
  | Readonly<{ kind: "writing-task-not-found" }>
  | Readonly<{ kind: "writing-task-unpublished" }>
  | Readonly<{ kind: "writing-version-conflict" }>
  | Readonly<{ kind: "writing-task-version-conflict" }>

export type WritingApplicationError =
  | WritingPersistenceError
  | Readonly<{ kind: "writing-ai-notice-required" }>
  | Readonly<{ kind: "writing-check-daily-limit" }>
  | Readonly<{ kind: "writing-check-invalid-result" }>
  | Readonly<{ kind: "writing-check-min-chars"; minChars: number }>
  | Readonly<{ kind: "writing-check-not-configured" }>
  | Readonly<{ kind: "writing-check-provider-unavailable" }>
  | Readonly<{ kind: "writing-task-not-ready-to-publish"; reason: string }>

type WritingBrief = WritingTaskPublication

export type WritingSession = Readonly<{
  aiNoticeAcknowledged: boolean
  brief: WritingBrief
  check: WritingCheckResult | null
  dailyChecksRemaining: number
  writing: WritingPiece
}>

export type WritingSummaryRecord = Readonly<{
  brief: Pick<
    WritingBrief,
    "difficulty" | "domain" | "taskId" | "title" | "typeName"
  >
  writing: WritingPiece
}>

export type WritingCatalogItem = Readonly<{
  audience: string
  difficulty: WritingDifficulty
  domain: WritingDomain
  goalChars: number
  publicationId: WritingTaskPublicationId
  situation: string
  taskId: WritingTaskId
  title: string
  typeName: string
}>

type WritingTaskListFilter = Readonly<{
  domain?: WritingDomain
  page: number
  pageSize: number
  query: string
  status: "all" | "draft" | "published"
}>

type WritingTaskListPage = Readonly<{
  items: readonly WritingTaskDraft[]
  page: number
  pageSize: number
  totalItems: number
}>

export type WritingCheckProvider = Readonly<{
  check: (input: {
    readonly body: string
    readonly brief: WritingBrief
  }) => Promise<
    Result<
      WritingCheckResult,
      Readonly<{
        cause?: unknown
        kind: "not-configured" | "unavailable"
      }>
    >
  >
}>

export type WritingRepository = Readonly<{
  acknowledgeAiNotice: (input: {
    readonly learnerId: LearnerId
    readonly now: Date
  }) => Promise<void>
  countSuccessfulChecksInRange: (input: {
    readonly from: Date
    readonly learnerId: LearnerId
    readonly to: Date
  }) => Promise<number>
  createCheck: (input: {
    readonly bodyVersion: number
    readonly eventType: WritingEventType
    readonly id: WritingCheckId
    readonly now: Date
    readonly result: WritingCheckResult
    readonly writing: WritingPiece
  }) => Promise<void>
  createPiece: (
    writing: WritingPiece,
    eventType: WritingEventType
  ) => Promise<void>
  createTask: (draft: WritingTaskDraft) => Promise<void>
  deletePiece: (input: {
    readonly eventType: WritingEventType
    readonly expectedVersion: number
    readonly learnerId: LearnerId
    readonly now: Date
    readonly writingId: WritingId
  }) => Promise<Result<WritingId, WritingPersistenceError>>
  findLatestPublicationByTaskId: (
    taskId: WritingTaskId
  ) => Promise<WritingTaskPublication | null>
  findPieceById: (input: {
    readonly learnerId: LearnerId
    readonly writingId: WritingId
  }) => Promise<WritingPiece | null>
  findPublicationById: (
    publicationId: WritingTaskPublicationId
  ) => Promise<WritingTaskPublication | null>
  findTaskById: (taskId: WritingTaskId) => Promise<WritingTaskDraft | null>
  findLatestCheck: (writingId: WritingId) => Promise<WritingCheckResult | null>
  hasAcknowledgedAiNotice: (learnerId: LearnerId) => Promise<boolean>
  hasSucceededCheck: (writingId: WritingId) => Promise<boolean>
  listCatalog: (input: {
    readonly domain?: WritingDomain
    readonly typeName?: string
  }) => Promise<readonly WritingCatalogItem[]>
  listPiecesByLearner: (
    learnerId: LearnerId
  ) => Promise<readonly WritingSummaryRecord[]>
  listTasks: (filter: WritingTaskListFilter) => Promise<WritingTaskListPage>
  publishTask: (input: {
    readonly draft: WritingTaskDraft
    readonly expectedEditVersion: number
    readonly publication: WritingTaskPublication
  }) => Promise<Result<WritingTaskDraft, WritingPersistenceError>>
  savePiece: (input: {
    readonly eventTypes: readonly WritingEventType[]
    readonly expectedVersion: number
    readonly writing: WritingPiece
  }) => Promise<Result<WritingPiece, WritingPersistenceError>>
  saveTask: (input: {
    readonly draft: WritingTaskDraft
    readonly expectedEditVersion: number
  }) => Promise<Result<WritingTaskDraft, WritingPersistenceError>>
}>

export type WritingApplication = Readonly<{
  acknowledgeAiNotice: (learnerId: LearnerId) => Promise<void>
  check: (input: {
    readonly learnerId: LearnerId
    readonly writingId: WritingId
  }) => Promise<Result<WritingSession, WritingApplicationError>>
  create: (input: {
    readonly learnerId: LearnerId
    readonly taskId: WritingTaskId
  }) => Promise<Result<WritingSession, WritingApplicationError>>
  delete: (input: {
    readonly expectedVersion: number
    readonly learnerId: LearnerId
    readonly writingId: WritingId
  }) => Promise<Result<WritingId, WritingApplicationError>>
  get: (input: {
    readonly learnerId: LearnerId
    readonly writingId: WritingId
  }) => Promise<Result<WritingSession, WritingApplicationError>>
  list: (learnerId: LearnerId) => Promise<readonly WritingSummaryRecord[]>
  listCatalog: (input: {
    readonly domain?: WritingDomain
    readonly typeName?: string
  }) => Promise<readonly WritingCatalogItem[]>
  save: (input: {
    readonly body: string
    readonly expectedVersion: number
    readonly learnerId: LearnerId
    readonly writingId: WritingId
  }) => Promise<Result<WritingSession, WritingApplicationError>>
}>

export type WritingAdminApplication = Readonly<{
  createTask: () => Promise<WritingTaskDraft>
  getTask: (
    taskId: WritingTaskId
  ) => Promise<Result<WritingTaskDraft, WritingApplicationError>>
  listTasks: (filter: WritingTaskListFilter) => Promise<WritingTaskListPage>
  publishTask: (input: {
    readonly expectedEditVersion: number
    readonly taskId: WritingTaskId
  }) => Promise<
    Result<
      Readonly<{
        draft: WritingTaskDraft
        publication: WritingTaskPublication
      }>,
      WritingApplicationError
    >
  >
  saveTask: (input: {
    readonly audience: string
    readonly difficulty: WritingDifficulty
    readonly domain: WritingDomain
    readonly expectedEditVersion: number
    readonly goalChars: number
    readonly minChars: number
    readonly requiredElements: readonly string[]
    readonly situation: string
    readonly taskId: WritingTaskId
    readonly title: string
    readonly typeName: string
  }) => Promise<Result<WritingTaskDraft, WritingApplicationError>>
}>
