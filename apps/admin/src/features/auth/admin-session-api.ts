import type { AdminHttpTransport } from "@/lib/api/admin-http-transport"
import type { AdminApiResult } from "@/lib/api/api-result"
import { adminSessionDtoSchema, type AdminId } from "@workspace/contracts/admin"

export type AdminSession = {
  readonly admin: {
    readonly email: string
    readonly id: AdminId
    readonly name: string
    readonly role: "operator" | "owner"
  }
}

export type AdminSessionApi = {
  readonly getSession: () => Promise<AdminApiResult<AdminSession>>
}

export function createAdminSessionApi(
  transport: AdminHttpTransport
): AdminSessionApi {
  return {
    async getSession() {
      const result = await transport.requestJson({
        method: "GET",
        path: "/session",
        schema: adminSessionDtoSchema,
      })
      return result.status === "error"
        ? result
        : {
            status: "ok",
            value: {
              admin: { ...result.value.admin },
            },
          }
    },
  }
}
