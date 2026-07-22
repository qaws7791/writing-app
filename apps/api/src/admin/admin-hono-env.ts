import { defineRouteForEnv } from "@workspace/http-platform/core"
import type { IdentityAdminHonoEnv } from "@workspace/identity/http"

export type AdminHonoEnv = IdentityAdminHonoEnv

export const defineAdminRoute = defineRouteForEnv<AdminHonoEnv>()
