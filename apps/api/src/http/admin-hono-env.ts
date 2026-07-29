import type { ContentAdminHonoEnv } from "@workspace/content/http"
import type { IdentityAdminHonoEnv } from "@workspace/identity/http"
import type { OperationsHonoEnv } from "@workspace/operations/http"

export type AdminHonoEnv = ContentAdminHonoEnv &
  IdentityAdminHonoEnv &
  OperationsHonoEnv
