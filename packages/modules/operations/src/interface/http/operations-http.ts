import type { AnyRouteConfig } from "@workspace/http-platform/core"

import type {
  AiConversationQueries,
  AiStreamingApplication,
} from "#operations/application/ai-conversations"
import type { AiRequestGuard } from "#operations/application/ai-request-guard"
import type { OperationsReportingQueries } from "#operations/application/operations-reporting"
import type {
  OperationsAdminSessionPort,
  OperationsSecurityAuditPort,
} from "#operations/application/ports/operations-ports"
import { createOperationsAiRoutes } from "#operations/interface/http/ai-routes"
import { createOperationsReportingRoutes } from "#operations/interface/http/reporting-routes"

export type OperationsHttpRouteGroup = readonly Readonly<{
  handler: unknown
  route: AnyRouteConfig
}>[]

export function createOperationsRoutes(input: {
  readonly ai: Readonly<{
    conversations: AiConversationQueries
    guard: AiRequestGuard
    streaming: AiStreamingApplication
  }>
  readonly audit: OperationsSecurityAuditPort
  readonly now: () => Date
  readonly reporting: OperationsReportingQueries
  readonly session: OperationsAdminSessionPort
}): OperationsHttpRouteGroup {
  return Object.freeze([
    ...createOperationsAiRoutes({
      audit: input.audit,
      conversations: input.ai.conversations,
      guard: input.ai.guard,
      now: input.now,
      session: input.session,
      streaming: input.ai.streaming,
    }),
    ...createOperationsReportingRoutes({
      now: input.now,
      queries: input.reporting,
      session: input.session,
    }),
  ])
}

export type { OperationsHonoEnv } from "#operations/interface/http/operations-http-auth"
