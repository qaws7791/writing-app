import type { OpenAPIHono } from "@hono/zod-openapi"

import type { AuditTrail } from "#operations/application/audit-trail"
import type { OperationsReportingQueries } from "#operations/application/operations-reporting"
import type { OperationsAdminSessionPort } from "#operations/application/ports/operations-ports"
import { registerOperationsAuditRoutes } from "#operations/interface/http/audit-routes"
import type { OperationsHonoEnv } from "#operations/interface/http/operations-http-auth"
import { registerOperationsReportingRoutes } from "#operations/interface/http/reporting-routes"

export function registerOperationsRoutes<TEnv extends OperationsHonoEnv>(
  app: OpenAPIHono<TEnv>,
  input: {
    readonly auditTrail: AuditTrail
    readonly now: () => Date
    readonly reporting: OperationsReportingQueries
    readonly session: OperationsAdminSessionPort
  }
): void {
  registerOperationsAuditRoutes(app, {
    auditTrail: input.auditTrail,
    session: input.session,
  })
  registerOperationsReportingRoutes(app, {
    now: input.now,
    queries: input.reporting,
    session: input.session,
  })
}

export type { OperationsHonoEnv } from "#operations/interface/http/operations-http-auth"
