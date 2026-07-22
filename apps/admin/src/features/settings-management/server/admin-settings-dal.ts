import type { AdminHttpTransport } from "@/shared/http/admin-http-transport"
import type { AdminApiResult } from "@/shared/http/admin-api-result"
import { adminContentResetResultSchema } from "@workspace/contracts/operations/admin-content-reset"
import { adminSettingsDtoSchema } from "@workspace/contracts/operations/admin-settings"
import type {
  AdminContentResetResult,
  AdminLegalSettingsRequest,
  AdminNoticeSettingsRequest,
  AdminSettings,
} from "@/features/settings-management/model/admin-settings"

export type AdminSettingsDal = {
  readonly getSettings: () => Promise<AdminApiResult<AdminSettings>>
  readonly resetContent: () => Promise<AdminApiResult<AdminContentResetResult>>
  readonly saveLegalSettings: (
    input: AdminLegalSettingsRequest
  ) => Promise<AdminApiResult<AdminSettings>>
  readonly saveNoticeSettings: (
    input: AdminNoticeSettingsRequest
  ) => Promise<AdminApiResult<AdminSettings>>
}

export function createAdminSettingsDal(
  transport: AdminHttpTransport
): AdminSettingsDal {
  const requestSettings = async (
    method: "GET" | "PUT",
    path: string,
    body?: unknown
  ) =>
    transport.requestJson({
      body,
      method,
      path,
      schema: adminSettingsDtoSchema,
    })
  return {
    getSettings: () => requestSettings("GET", "/api/admin/settings"),
    async resetContent() {
      return transport.requestJson({
        body: {},
        method: "POST",
        path: "/api/admin/settings/content-reset",
        schema: adminContentResetResultSchema,
      })
    },
    saveLegalSettings: (input) =>
      requestSettings("PUT", "/api/admin/settings/legal", input),
    saveNoticeSettings: (input) =>
      requestSettings("PUT", "/api/admin/settings/notice", input),
  }
}
