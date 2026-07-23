import "server-only"

import {
  adminContentResetResultSchema,
  type AdminContentResetResultDto,
} from "@workspace/contracts/content/admin-content-reset"

import type { AdminApiResult } from "@/shared/http/admin-api-result"
import type { AdminHttpTransport } from "@/shared/http/admin-http-transport"

export type AdminContentMaintenanceDal = Readonly<{
  resetContent: () => Promise<AdminApiResult<AdminContentResetResultDto>>
}>

export function createAdminContentMaintenanceDal(
  transport: AdminHttpTransport
): AdminContentMaintenanceDal {
  return Object.freeze({
    resetContent: () =>
      transport.requestJson({
        body: {},
        method: "POST",
        path: "/api/admin/maintenance/content-reset",
        schema: adminContentResetResultSchema,
      }),
  })
}
