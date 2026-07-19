import type { AdminHttpTransport } from "@/shared/http/admin-http-transport"
import type { AdminApiResult } from "@/shared/http/admin-api-result"
import {
  adminSessionDtoSchema,
  type AdminSessionDto,
} from "@workspace/contracts/admin"

export type AdminSession = AdminSessionDto

export type AdminSessionDal = {
  readonly getSession: () => Promise<AdminApiResult<AdminSession>>
}

export function createAdminSessionDal(
  transport: AdminHttpTransport
): AdminSessionDal {
  return {
    async getSession() {
      return transport.requestJson({
        method: "GET",
        path: "/api/admin/session",
        schema: adminSessionDtoSchema,
      })
    },
  }
}
