"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import {
  userIdSchema,
  type UserId,
} from "@/entities/learner-account/model/learner-account-id"
import { createAdminUsersDal } from "@/features/user-management/server/admin-users-dal"
import { getServerAdminSessionToken } from "@/server/auth/get-admin-session-token"
import { getServerAdminHttpTransport } from "@/server/http/get-admin-http-transport"
import { createAdminActionError } from "@/shared/http/admin-api-result"

const updateAdminUserStatusCommandSchema = z.object({
  status: z.enum(["active", "suspended"]),
  userId: userIdSchema,
})

export async function updateAdminUserStatusAction(input: unknown) {
  const command = updateAdminUserStatusCommandSchema.safeParse(input)
  if (!command.success) return createAdminActionError("invalid-request")

  const token = await getServerAdminSessionToken()
  if (token === null) return createAdminActionError("unauthorized")

  const result = await createAdminUsersDal(
    getServerAdminHttpTransport({ tokenProvider: () => token })
  ).updateUserStatus(command.data)

  if (result.status === "ok") revalidateUserPaths(command.data.userId)
  return result
}

export async function deleteAdminUserAction(input: unknown) {
  const userId = userIdSchema.safeParse(input)
  if (!userId.success) return createAdminActionError("invalid-request")

  const token = await getServerAdminSessionToken()
  if (token === null) return createAdminActionError("unauthorized")

  const result = await createAdminUsersDal(
    getServerAdminHttpTransport({ tokenProvider: () => token })
  ).deleteUser(userId.data)

  if (result.status === "ok") revalidateUserPaths(userId.data)
  return result
}

function revalidateUserPaths(userId: UserId): void {
  revalidatePath("/users")
  revalidatePath(`/users/${userId}`)
}
