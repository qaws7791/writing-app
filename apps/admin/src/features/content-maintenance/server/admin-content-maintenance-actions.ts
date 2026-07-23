"use server"

import "server-only"

import { createAdminContentMaintenanceDal } from "@/features/content-maintenance/server/admin-content-maintenance-dal"
import { getServerAdminSessionToken } from "@/server/auth/get-admin-session-token"
import { getServerAdminHttpTransport } from "@/server/http/get-admin-http-transport"
import { createAdminActionError } from "@/shared/http/admin-api-result"

export async function resetAdminContentAction() {
  const token = await getServerAdminSessionToken()
  if (token === null) return createAdminActionError("unauthorized")

  return createAdminContentMaintenanceDal(
    getServerAdminHttpTransport({ tokenProvider: () => token })
  ).resetContent()
}
