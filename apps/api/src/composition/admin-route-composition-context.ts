import type { WritingAppDatabase } from "@workspace/db/client"
import type { AdminSessionResolver } from "@workspace/auth/admin/server"
import type { ApiEnv } from "@/config/env"
import type { AppLogger } from "@workspace/observability/logger"

export type AdminRouteCompositionContext = {
  readonly database: WritingAppDatabase
  readonly env: ApiEnv
  readonly logger: AppLogger
  readonly now: () => Date
  readonly sessionResolver: AdminSessionResolver
}
