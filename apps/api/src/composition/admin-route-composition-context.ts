import type { WritingAppDatabase } from "@workspace/db/client"
import type { IdentityModule } from "@workspace/identity/module"
import type { ContentModule } from "@workspace/content/module"
import type { AdminSessionResolver } from "@workspace/identity/sessions"
import type { ApiEnv } from "@/config/env"
import type { AppLogger } from "@workspace/observability/logger"
import type { ResourceLibraryModule } from "@workspace/resource-library/module"

export type AdminRouteCompositionContext = {
  readonly content: ContentModule
  readonly database: WritingAppDatabase
  readonly env: ApiEnv
  readonly identity: IdentityModule
  readonly logger: AppLogger
  readonly now: () => Date
  readonly resourceLibrary: ResourceLibraryModule
  readonly sessionResolver: AdminSessionResolver
}
