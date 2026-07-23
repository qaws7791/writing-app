import type { ContentModule } from "@workspace/content/module"
import type { WritingAppDatabase } from "@workspace/db/client"
import type { IdentityModule } from "@workspace/identity/module"
import type { AdminSessionResolver } from "@workspace/identity/sessions"
import type { LearningReportingQuery } from "@workspace/learning/reporting"
import {
  createOperationsModule,
  type OperationsModule,
} from "@workspace/operations/module"
import type {
  OperationsAdminSessionPort,
  OperationsAiKnowledgePort,
  OperationsSecurityAuditPort,
} from "@workspace/operations/ports"
import type { AppLogger } from "@workspace/observability/logger"
import type { ResourceLibraryModule } from "@workspace/resource-library/module"
import type { Clock } from "@workspace/kernel/clock"

export function composeOperationsModule(
  input: Readonly<{
    aiConfig: Readonly<{ apiKey: string; model: string }> | null
    content: ContentModule
    clock: Clock
    database: WritingAppDatabase
    identity: IdentityModule
    learningReporting: LearningReportingQuery
    logger: AppLogger
    resourceLibrary: ResourceLibraryModule
  }>
): OperationsModule {
  return createOperationsModule({
    aiConfig: input.aiConfig,
    audit: createOperationsAuditPort(input.logger),
    clock: input.clock,
    database: input.database,
    knowledge: createOperationsKnowledgePort(input.resourceLibrary),
    providerFailureObserver(event) {
      input.logger.warn(event, "operations.ai.provider_failed")
    },
    reporting: {
      content: input.content.operationsReportingQuery,
      identity: input.identity.operationsReportingQuery,
      learning: input.learningReporting,
    },
    reportingFailureObserver(event) {
      input.logger.warn(event, "operations.reporting.source_failed")
    },
  })
}

export function createOperationsAdminSessionPort(
  sessionResolver: AdminSessionResolver
): OperationsAdminSessionPort {
  return Object.freeze({
    async resolveActor(headers) {
      const session = await sessionResolver.resolveSession(headers)
      if (session === null) return null
      return Object.freeze({
        id: session.admin.id,
        role: session.admin.role,
      })
    },
  })
}

function createOperationsKnowledgePort(
  resourceLibrary: ResourceLibraryModule
): OperationsAiKnowledgePort {
  return Object.freeze({
    async readResourceDocument(documentId) {
      const document =
        await resourceLibrary.knowledgeQuery.documents.readDocument(documentId)
      return document === null
        ? null
        : Object.freeze({
            contentMarkdown: document.contentMarkdown,
            id: document.id,
            name: document.name,
            version: document.version,
          })
    },
    async searchResources(query) {
      const results = await resourceLibrary.knowledgeQuery.search.search(query)
      return results.map((result) =>
        Object.freeze({
          excerpt: result.excerpt,
          id: result.id,
          name: result.name,
          version: result.version,
        })
      )
    },
  })
}

function createOperationsAuditPort(
  logger: AppLogger
): OperationsSecurityAuditPort {
  return (event) => {
    const write = event.outcome === "succeeded" ? logger.info : logger.warn
    write.call(logger, event, "security.audit")
  }
}
