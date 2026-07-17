import type { AdminHttpTransport } from "@/lib/api/admin-http-transport"
import type { AdminApiResult } from "@/lib/api/api-result"
import {
  adminContentResetResultSchema,
  adminSettingsDtoSchema,
  type AdminContentResetResultDto,
  type AdminLegalSettingsRequest,
  type AdminNoticeSettingsRequest,
  type AdminSettingsDto,
} from "@workspace/contracts/admin"

export type { AdminLegalSettingsRequest, AdminNoticeSettingsRequest }
export type AdminSettings = AdminSettingsDto
export type AdminContentResetResult = AdminContentResetResultDto
export type AdminSettingsApi = {
  readonly getSettings: () => Promise<AdminApiResult<AdminSettings>>
  readonly resetContent: () => Promise<AdminApiResult<AdminContentResetResult>>
  readonly saveLegalSettings: (
    input: AdminLegalSettingsRequest
  ) => Promise<AdminApiResult<AdminSettings>>
  readonly saveNoticeSettings: (
    input: AdminNoticeSettingsRequest
  ) => Promise<AdminApiResult<AdminSettings>>
}

export function createAdminSettingsApi(
  transport: AdminHttpTransport
): AdminSettingsApi {
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
    getSettings: () => requestSettings("GET", "/settings"),
    async resetContent() {
      return transport.requestJson({
        body: {},
        method: "POST",
        path: "/settings/content-reset",
        schema: adminContentResetResultSchema,
      })
    },
    saveLegalSettings: (input) =>
      requestSettings("PUT", "/settings/legal", input),
    saveNoticeSettings: (input) =>
      requestSettings("PUT", "/settings/notice", input),
  }
}
