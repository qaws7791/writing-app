import type { Database } from "bun:sqlite"
import type { ContentModule } from "@workspace/content/module"
import type { ContentError } from "@workspace/content/application"
import type { WritingAppDatabase } from "@workspace/db/client"
import { authorizeOwnerMutation } from "@workspace/identity/admin-actor"
import type { IdentityModule } from "@workspace/identity/module"
import type { AdminSessionResolver } from "@workspace/identity/sessions"
import type { LearningReportingQuery } from "@workspace/learning/reporting"
import {
  createOperationsModule,
  type OperationsModule,
} from "@workspace/operations/module"
import type {
  AiChangeTargetPort,
  OperationsAdminSessionPort,
  OperationsAiKnowledgePort,
  OperationsSecurityAuditPort,
} from "@workspace/operations/ports"
import type { AppLogger } from "@workspace/observability/logger"
import type { ResourceLibraryModule } from "@workspace/resource-library/module"
import type { ResourceCommandResult } from "@workspace/resource-library/ports"
import type { OperationsError } from "@workspace/operations/application"
import type { Clock, IdGenerator } from "@workspace/kernel/clock"
import type { AiChangeProposalId } from "@workspace/types/ids"

export function composeOperationsModule(
  input: Readonly<{
    aiConfig: Readonly<{ apiKey: string; model: string }> | null
    content: ContentModule
    clock: Clock
    database: WritingAppDatabase
    identity: IdentityModule
    learningReporting: LearningReportingQuery
    logger: AppLogger
    proposalIdGenerator: IdGenerator<AiChangeProposalId>
    resourceLibrary: ResourceLibraryModule
    sqlite: Database
  }>
): OperationsModule {
  return createOperationsModule({
    aiConfig: input.aiConfig,
    audit: createOperationsAuditPort(input.logger),
    clock: input.clock,
    database: input.database,
    knowledge: createOperationsKnowledgePort(input.resourceLibrary),
    proposalIdGenerator: input.proposalIdGenerator,
    reporting: {
      content: input.content.operationsReportingQuery,
      identity: input.identity.operationsReportingQuery,
      learning: input.learningReporting,
    },
    reportingFailureObserver(event) {
      input.logger.warn(event, "operations.reporting.source_failed")
    },
    sqlite: input.sqlite,
    target: createOperationsChangeTarget(input.content, input.resourceLibrary),
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
        email: session.admin.email,
        id: session.admin.id,
        name: session.admin.name,
        settingsMutation: authorizeOwnerMutation({
          id: session.admin.id,
          role: session.admin.role,
        }),
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

function createOperationsChangeTarget(
  content: ContentModule,
  resourceLibrary: ResourceLibraryModule
): AiChangeTargetPort {
  return Object.freeze({
    async applyContentDraft(actor, change) {
      const document = await content.application.getCourseEditor(
        change.courseId
      )
      if (document === null) {
        return { kind: "not-found", target: "content-course-draft" }
      }
      const result = await content.changeCommands.saveCourseEditor({
        actor: {
          adminId: actor.id,
          mutation: actor.settingsMutation,
        },
        document: {
          ...document,
          description: change.description ?? document.description,
          title: change.title ?? document.title,
        },
        expectedEditVersion: change.expectedEditVersion,
      })
      return result.isOk() ? { kind: "ok" } : mapContentError(result.error)
    },
    async applyResourceDocument(actor, change) {
      const document =
        await resourceLibrary.knowledgeQuery.documents.readDocument(
          change.documentId
        )
      if (document === null) {
        return { kind: "not-found", target: "resource-document" }
      }
      const result = await resourceLibrary.commands.saveDocument({
        actor: {
          access: "allowed",
          email: actor.email,
          id: actor.id,
          name: actor.name,
        },
        contentMarkdown: change.contentMarkdown ?? document.contentMarkdown,
        documentId: change.documentId,
        expectedVersion: change.expectedVersion,
        name: change.name ?? document.name,
      })
      return result.kind === "ok" ? { kind: "ok" } : mapResourceError(result)
    },
  })
}

function mapContentError(error: ContentError): OperationsError {
  switch (error.kind) {
    case "content-conflict":
    case "content-immutable-revision":
      return { kind: "conflict", reason: error.kind }
    case "content-forbidden":
    case "content-reset-forbidden":
      return { kind: "permission-denied" }
    case "content-not-found":
      return { kind: "not-found", target: "content-course-draft" }
    case "content-validation-failed":
      return { kind: "validation-failed", reason: error.reason }
  }
}

function mapResourceError(
  error: Exclude<ResourceCommandResult<unknown>, { readonly kind: "ok" }>
): OperationsError {
  switch (error.kind) {
    case "resource-conflict":
      return { kind: "conflict", reason: error.reason }
    case "resource-forbidden":
      return { kind: "permission-denied" }
    case "resource-not-found":
      return { kind: "not-found", target: "resource-document" }
    case "resource-persistence-failure":
      return { kind: "persistence-failed", operation: error.operation }
    case "resource-storage-failure":
      return { kind: "persistence-failed", operation: error.operation }
    case "resource-validation":
      return { kind: "validation-failed", reason: error.reason }
  }
}

function createOperationsAuditPort(
  logger: AppLogger
): OperationsSecurityAuditPort {
  return (event) => {
    const write = event.outcome === "succeeded" ? logger.info : logger.warn
    write.call(logger, event, "security.audit")
  }
}
