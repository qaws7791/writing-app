import type {
  AdminId,
  AiChangeProposalId,
  ConversationId,
  CourseId,
  LessonId,
  ResourceDocumentId,
  UserId,
} from "@workspace/types/ids"

import type {
  AiChange,
  AiChangeProposal,
  AiChangeProposalStatus,
} from "#operations/domain/ai-change-proposal"
import type {
  AiConversationHistory,
  AiConversationSummary,
  AiMessage,
} from "#operations/domain/ai-conversation"
import type { OperationsActor } from "#operations/domain/operations-actor"
import type { OperationsError } from "#operations/domain/operations-error"
import type {
  LegalDocument,
  NoticeDocument,
  OperationsSettings,
} from "#operations/domain/operations-settings"

export type OperationsIdentitySnapshot = Readonly<{
  createdAt: Date
  email: string
  id: UserId
  name: string
}>

export type OperationsContentReport = Readonly<{
  activeCourses: number
  activeLessons: number
  lessons: readonly Readonly<{
    courseId: CourseId
    courseTitle: string
    lessonId: LessonId
    lessonTitle: string
  }>[]
}>

export type OperationsLearningReport = Readonly<{
  learnerActivities: readonly Readonly<{
    currentStreakDays: number
    lastActiveDate: string
    userId: UserId
  }>[]
  lessonProgress: readonly Readonly<{
    completedAt: string | null
    lessonId: LessonId
    status: "completed" | "in_progress"
    userId: UserId
  }>[]
}>

export type OperationsReportingPorts = Readonly<{
  content: Readonly<{
    readContentReport: () => Promise<OperationsContentReport>
  }>
  identity: Readonly<{
    readNonDeletedLearners: () => Promise<readonly OperationsIdentitySnapshot[]>
  }>
  learning: Readonly<{
    readOperationsReport: () => Promise<OperationsLearningReport>
  }>
}>

export type OperationsReportingFailureObserver = (
  event: Readonly<{
    kind: "operations-reporting-source-failed"
    source: "content" | "identity" | "learning"
  }>
) => void

export type OperationsSettingsRepository = Readonly<{
  readSettings: () => Promise<OperationsSettings>
  saveLegalDocument: (
    input: LegalDocument & { readonly now: Date }
  ) => Promise<OperationsSettings>
  saveNoticeDocument: (
    input: NoticeDocument & { readonly now: Date }
  ) => Promise<OperationsSettings>
}>

export type AiConversationRepository = Readonly<{
  createUserMessage: (
    input: Readonly<{
      adminId: AdminId
      conversationId: ConversationId | null
      message: string
      now: Date
    }>
  ) => Promise<AiConversationHistory | null>
  readConversation: (
    input: Readonly<{
      adminId: AdminId
      conversationId: ConversationId
      messagePage: number
      messagePageSize: number
    }>
  ) => Promise<AiConversationHistory | null>
  readConversations: (
    input: Readonly<{
      adminId: AdminId
      page: number
      pageSize: number
    }>
  ) => Promise<readonly AiConversationSummary[]>
  saveAssistantMessage: (
    input: Readonly<{
      content: string
      conversationId: ConversationId
      now: Date
    }>
  ) => Promise<AiMessage>
}>

export type AiProviderPort = Readonly<{
  streamText: (
    prompt: string,
    options: Readonly<{
      adminId: AdminId
      conversationId: ConversationId
      maxOutputTokens: number
      signal: AbortSignal
    }>
  ) => Promise<AsyncIterable<string>>
}>

export type AiChangeProposalRepository = Readonly<{
  createProposal: (proposal: AiChangeProposal) => Promise<void>
  readProposal: (
    proposalId: AiChangeProposalId
  ) => Promise<AiChangeProposal | null>
  transitionProposal: (
    input: Readonly<{
      expectedStatus: AiChangeProposalStatus
      proposal: AiChangeProposal
    }>
  ) => Promise<"conflict" | "updated">
}>

export type AiChangeTargetPort = Readonly<{
  applyContentDraft: (
    actor: OperationsActor,
    change: Extract<AiChange, { readonly kind: "content-course-draft" }>
  ) => Promise<OperationsError | Readonly<{ kind: "ok" }>>
  applyResourceDocument: (
    actor: OperationsActor,
    change: Extract<AiChange, { readonly kind: "resource-document" }>
  ) => Promise<OperationsError | Readonly<{ kind: "ok" }>>
}>

export type AiQuotaRepository = Readonly<{
  consume: (
    input: Readonly<{
      adminId: AdminId
      clientIp: string
      limits: Readonly<{
        dailyAdmin: number
        minuteAdmin: number
        minuteIp: number
      }>
      now: Date
    }>
  ) => Promise<
    | Readonly<{ kind: "accepted" }>
    | Readonly<{
        kind: "rejected"
        reason: "admin-day" | "admin-minute" | "ip-minute"
        retryAfterSeconds: number
      }>
  >
}>

export type OperationsAdminSessionPort = Readonly<{
  resolveActor: (headers: Headers) => Promise<OperationsActor | null>
}>

export type OperationsSecurityAuditPort = (
  event: Readonly<{
    action: "ai.change.reviewed" | "ai.quota.exceeded" | "owner.mutation"
    actorId: AdminId
    outcome: "denied" | "failed" | "succeeded"
    reason?: string
    requestId: string
    target: string
  }>
) => void

export type OperationsAiKnowledgePort = Readonly<{
  readResourceDocument: (documentId: ResourceDocumentId) => Promise<Readonly<{
    contentMarkdown: string
    id: ResourceDocumentId
    name: string
    version: number
  }> | null>
  searchResources: (
    input: Readonly<{ limit: number; query: string }>
  ) => Promise<
    readonly Readonly<{
      excerpt: string | null
      id: ResourceDocumentId
      name: string
      version: number
    }>[]
  >
}>

export type OperationsClock = Readonly<{ now: () => Date }>

export type OperationsProposalIdGenerator = Readonly<{
  next: () => AiChangeProposalId
}>
