"use server"

import { revalidatePath } from "next/cache"

import { createAdminUsersApi } from "@/features/users/admin-users-api"
import { getServerAdminHttpTransport } from "@/lib/api/get-server-admin-http-transport"
import type { UserId } from "@/lib/api/admin-identity"
import { getServerAdminSessionToken } from "@/lib/auth/server-admin-session-token"
import type { LearnerOperationalStatus } from "@workspace/contracts/status"

export async function updateAdminUserStatusAction(input: {
  readonly status: LearnerOperationalStatus
  readonly userId: UserId
}) {
  const result = await createServerApi().updateUserStatus(input)

  if (result.status === "ok") revalidateUserPaths(input.userId)
  return result
}

export async function deleteAdminUserAction(userId: UserId) {
  const result = await createServerApi().deleteUser(userId)

  if (result.status === "ok") revalidateUserPaths(userId)
  return result
}

function createServerApi() {
  return createAdminUsersApi(
    getServerAdminHttpTransport({ tokenProvider: getServerAdminSessionToken })
  )
}

function revalidateUserPaths(userId: UserId): void {
  revalidatePath("/users")
  revalidatePath(`/users/${userId}`)
}
