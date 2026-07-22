"use server"

import "server-only"

import {
  adminLegalSettingsRequestSchema,
  adminNoticeSettingsRequestSchema,
} from "@workspace/contracts/operations/admin-settings"

import { createAdminSettingsDal } from "@/features/settings-management/server/admin-settings-dal"
import { getServerAdminSessionToken } from "@/server/auth/get-admin-session-token"
import { getServerAdminHttpTransport } from "@/server/http/get-admin-http-transport"
import { createAdminActionError } from "@/shared/http/admin-api-result"

export async function saveAdminNoticeSettingsAction(input: unknown) {
  const command = adminNoticeSettingsRequestSchema.safeParse(input)
  if (!command.success) return createAdminActionError("invalid-request")
  const dal = await createAuthenticatedSettingsDal()
  if (dal === null) return createAdminActionError("unauthorized")
  return dal.saveNoticeSettings(command.data)
}

export async function saveAdminLegalSettingsAction(input: unknown) {
  const command = adminLegalSettingsRequestSchema.safeParse(input)
  if (!command.success) return createAdminActionError("invalid-request")
  const dal = await createAuthenticatedSettingsDal()
  if (dal === null) return createAdminActionError("unauthorized")
  return dal.saveLegalSettings(command.data)
}

export async function resetAdminContentAction() {
  const dal = await createAuthenticatedSettingsDal()
  if (dal === null) return createAdminActionError("unauthorized")
  return dal.resetContent()
}

async function createAuthenticatedSettingsDal() {
  const token = await getServerAdminSessionToken()
  return token === null
    ? null
    : createAdminSettingsDal(
        getServerAdminHttpTransport({ tokenProvider: () => token })
      )
}
