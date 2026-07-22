import type { Database } from "bun:sqlite"
import type { WritingAppDatabase } from "@workspace/db/client"

import {
  createAiChangeProposalApplication,
  type AiChangeProposalApplication,
} from "#operations/application/ai-change-proposals"
import {
  createAiConversationQueries,
  createAiStreamingApplication,
  type AiConversationQueries,
  type AiStreamingApplication,
} from "#operations/application/ai-conversations"
import { createAiRequestGuard } from "#operations/application/ai-request-guard"
import {
  createOperationsReportingQueries,
  type OperationsReportingQueries,
} from "#operations/application/operations-reporting"
import {
  createOperationsSettingsApplication,
  type OperationsSettingsApplication,
} from "#operations/application/operations-settings"
import type {
  AiChangeTargetPort,
  OperationsAdminSessionPort,
  OperationsAiKnowledgePort,
  OperationsClock,
  OperationsReportingFailureObserver,
  OperationsReportingPorts,
  OperationsSecurityAuditPort,
} from "#operations/application/ports/operations-ports"
import { createOperationsMastraProvider } from "#operations/infrastructure/ai/operations-mastra-provider"
import { createAiChangeProposalRepository } from "#operations/infrastructure/persistence/ai-change-proposal-repository"
import { createAiConversationRepository } from "#operations/infrastructure/persistence/ai-conversation-repository"
import { createAiQuotaRepository } from "#operations/infrastructure/persistence/ai-quota-repository"
import { createOperationsSettingsRepository } from "#operations/infrastructure/persistence/operations-settings-repository"
import { runOperationsSchemaMigration } from "#operations/infrastructure/persistence/schema-migration"
import {
  createOperationsRoutes,
  type OperationsHttpRouteGroup,
} from "#operations/interface/http/operations-http"
import type { AiChangeProposalId } from "@workspace/types/ids"
import type { IdGenerator } from "@workspace/kernel/clock"

export type OperationsModule = Readonly<{
  ai: Readonly<{
    conversations: AiConversationQueries
    proposals: AiChangeProposalApplication
    streaming: AiStreamingApplication
  }>
  closeAi: () => Promise<void>
  createAdminRoutes: (
    session: OperationsAdminSessionPort
  ) => OperationsHttpRouteGroup
  reporting: OperationsReportingQueries
  settings: OperationsSettingsApplication
}>

export function createOperationsModule(
  input: Readonly<{
    aiConfig: Readonly<{ apiKey: string; model: string }> | null
    audit: OperationsSecurityAuditPort
    clock: OperationsClock
    database: WritingAppDatabase
    knowledge: OperationsAiKnowledgePort
    proposalIdGenerator: IdGenerator<AiChangeProposalId>
    reporting: OperationsReportingPorts
    reportingFailureObserver: OperationsReportingFailureObserver
    sqlite: Database
    target: AiChangeTargetPort
  }>
): OperationsModule {
  runOperationsSchemaMigration(input.sqlite)
  const proposalRepository = createAiChangeProposalRepository(input.database)
  const proposals = createAiChangeProposalApplication({
    clock: input.clock,
    idGenerator: input.proposalIdGenerator,
    repository: proposalRepository,
    target: input.target,
  })
  const managedProvider =
    input.aiConfig === null
      ? null
      : createOperationsMastraProvider({
          apiKey: input.aiConfig.apiKey,
          knowledge: input.knowledge,
          model: input.aiConfig.model,
          proposals,
        })
  const conversationRepository = createAiConversationRepository(input.database)
  const conversations = createAiConversationQueries(conversationRepository)
  const streaming = createAiStreamingApplication({
    clock: input.clock,
    provider: managedProvider?.provider ?? null,
    repository: conversationRepository,
  })
  const reporting = createOperationsReportingQueries({
    observer: input.reportingFailureObserver,
    ports: input.reporting,
  })
  const settings = createOperationsSettingsApplication(
    createOperationsSettingsRepository(input.database)
  )
  const guard = createAiRequestGuard({
    repository: createAiQuotaRepository(input.database),
  })

  return Object.freeze({
    ai: Object.freeze({ conversations, proposals, streaming }),
    closeAi: managedProvider?.close ?? (() => Promise.resolve()),
    createAdminRoutes(session) {
      return createOperationsRoutes({
        ai: { conversations, guard, proposals, streaming },
        audit: input.audit,
        now: input.clock.now,
        reporting,
        session,
        settings,
      })
    },
    reporting,
    settings,
  })
}
