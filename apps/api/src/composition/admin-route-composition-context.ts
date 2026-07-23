import type { WritingAppDatabase } from "@workspace/db/client"
import type { IdentityModule } from "@workspace/identity/module"
import type { ContentModule } from "@workspace/content/module"
import type { AdminSessionResolver } from "@workspace/identity/sessions"
import type { AppLogger } from "@workspace/observability/logger"
import type { ResourceLibraryModule } from "@workspace/resource-library/module"
import type { LearningReportingQuery } from "@workspace/learning/reporting"
import type { Clock } from "@workspace/kernel/clock"

export type AdminRouteCompositionContext = {
  readonly aiConfig: Readonly<{ apiKey: string; model: string }> | null
  readonly clock: Clock
  readonly content: ContentModule
  readonly database: WritingAppDatabase
  readonly identity: IdentityModule
  readonly learningReporting: LearningReportingQuery
  readonly logger: AppLogger
  readonly resourceLibrary: ResourceLibraryModule
  readonly sessionResolver: AdminSessionResolver
}
