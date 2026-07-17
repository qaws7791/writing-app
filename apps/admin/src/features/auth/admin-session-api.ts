import type { AdminHttpTransport } from "@/lib/api/admin-http-transport"
import type { AdminApiResult } from "@/lib/api/api-result"
import {
  adminSessionDtoSchema,
  type AdminSessionDto,
} from "@workspace/contracts/admin"

export type AdminSession = AdminSessionDto

export type AdminSessionApi = {
  readonly getSession: () => Promise<AdminApiResult<AdminSession>>
}

export function createAdminSessionApi(
  transport: AdminHttpTransport
): AdminSessionApi {
  return {
    async getSession() {
      return transport.requestJson({
        method: "GET",
        path: "/session",
        schema: adminSessionDtoSchema,
      })
    },
  }
}
