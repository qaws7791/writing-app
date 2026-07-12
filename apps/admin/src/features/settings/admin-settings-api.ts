import type { AdminHttpTransport } from "@/lib/api/admin-http-transport"
import type { AdminApiResult } from "@/lib/api/api-result"
import {
  adminContentResetResultSchema,
  adminSettingsDtoSchema,
  type AdminContentResetResultDto,
  type AdminSettingsDto,
} from "@workspace/contracts/admin"

export type AdminNoticeSettingsRequest = {
  readonly announce: string
  readonly banner: string
}
export type AdminLegalSettingsRequest = {
  readonly privacy: string
  readonly terms: string
}
export type AdminSettings = {
  readonly legal: AdminLegalSettingsRequest
  readonly notice: AdminNoticeSettingsRequest
}
export type AdminContentResetResult = {
  readonly changed: {
    readonly archived: number
    readonly courses: number
    readonly lessons: number
    readonly steps: number
    readonly units: number
  }
  readonly revision: number
}
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
  ) => {
    const result = await transport.requestJson({
      body,
      method,
      path,
      schema: adminSettingsDtoSchema,
    })
    return result.status === "error"
      ? result
      : { status: "ok" as const, value: toSettings(result.value) }
  }
  return {
    getSettings: () => requestSettings("GET", "/settings"),
    async resetContent() {
      const result = await transport.requestJson({
        body: {},
        method: "POST",
        path: "/settings/content-reset",
        schema: adminContentResetResultSchema,
      })
      return result.status === "error"
        ? result
        : { status: "ok", value: toReset(result.value) }
    },
    saveLegalSettings: (input) =>
      requestSettings("PUT", "/settings/legal", input),
    saveNoticeSettings: (input) =>
      requestSettings("PUT", "/settings/notice", input),
  }
}

function toSettings(dto: AdminSettingsDto): AdminSettings {
  return { legal: { ...dto.legal }, notice: { ...dto.notice } }
}

function toReset(dto: AdminContentResetResultDto): AdminContentResetResult {
  return { changed: { ...dto.changed }, revision: dto.revision }
}
