import type { WritingAppDatabase } from "@workspace/db/client"

import {
  createContentApplication,
  type ContentApplication,
} from "#content/application/content-application"
import {
  createContentChangeCommandPort,
  type ContentChangeCommandPort,
} from "#content/application/content-commands"
import type {
  ContentAdminSessionPort,
  ContentApplicationDependencies,
} from "#content/application/ports/content-ports"
import {
  createContentLearningQuery,
  createOperationsContentReportingQuery,
  type ContentLearningQuery,
  type OperationsContentReportingQuery,
} from "#content/application/content-queries"
import { createDrizzleContentRepository } from "#content/infrastructure/persistence/content-drizzle-repository"
import {
  createAdminContentRoutes,
  type ContentHttpRouteGroup,
} from "#content/interface/http/content-http"

export type ContentModule = Readonly<{
  application: ContentApplication
  changeCommands: ContentChangeCommandPort
  createAdminRoutes: (
    sessionPort: ContentAdminSessionPort
  ) => ContentHttpRouteGroup
  learningQuery: ContentLearningQuery
  operationsReportingQuery: OperationsContentReportingQuery
}>

export function createContentModule(
  input: Omit<ContentApplicationDependencies, "repository"> & {
    readonly database: WritingAppDatabase
  }
): ContentModule {
  const repository = createDrizzleContentRepository(input.database)
  const application = createContentApplication({ ...input, repository })

  return Object.freeze({
    application,
    changeCommands: createContentChangeCommandPort(application),
    createAdminRoutes(sessionPort) {
      return createAdminContentRoutes({ application, sessionPort })
    },
    learningQuery: createContentLearningQuery(repository),
    operationsReportingQuery: createOperationsContentReportingQuery(repository),
  })
}
