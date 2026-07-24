import type { ContentAdminHonoEnv } from "@workspace/content/register-routes"
import type { IdentityAdminHonoEnv } from "@workspace/identity/http"
import type { OperationsHonoEnv } from "@workspace/operations/http"

export type AdminHonoEnv = ContentAdminHonoEnv &
  IdentityAdminHonoEnv &
  OperationsHonoEnv
