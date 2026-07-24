"use server"

import "server-only"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import {
  userIdSchema,
  type UserId,
} from "@/entities/learner-account/model/learner-account-id"
import {
  invalidAdminRequestFailure,
  settleAdminApiRequest,
  unauthenticatedAdminRequestFailure,
} from "@/shared/http/admin-api-client"
import { getServerAdminRequestOptions } from "@/server/http/admin-api-request-options"
import {
  deleteAdminUser,
  updateAdminUserStatus,
} from "@workspace/http-client/admin"

const updateAdminUserStatusCommandSchema = z.object({
  status: z.enum(["active", "suspended"]),
  userId: userIdSchema,
})

export async function updateAdminUserStatusAction(input: unknown) {
  const command = updateAdminUserStatusCommandSchema.safeParse(input)
  if (!command.success) return invalidAdminRequestFailure()

  const requestOptions = await getServerAdminRequestOptions()
  if (requestOptions === null) return unauthenticatedAdminRequestFailure()

  const result = await settleAdminApiRequest(
    updateAdminUserStatus(
      command.data.userId,
      { status: command.data.status },
      requestOptions
    )
  )

  if (result.status === "ok") revalidateUserPaths(command.data.userId)
  return result
}

export async function deleteAdminUserAction(input: unknown) {
  const userId = userIdSchema.safeParse(input)
  if (!userId.success) return invalidAdminRequestFailure()

  const requestOptions = await getServerAdminRequestOptions()
  if (requestOptions === null) return unauthenticatedAdminRequestFailure()

  const result = await settleAdminApiRequest(
    deleteAdminUser(userId.data, requestOptions)
  )

  if (result.status === "ok") revalidateUserPaths(userId.data)
  return result
}

function revalidateUserPaths(userId: UserId): void {
  revalidatePath("/users")
  revalidatePath(`/users/${userId}`)
}
