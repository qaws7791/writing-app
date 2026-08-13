"use server"

import "server-only"

import { revalidatePath } from "next/cache"

import {
  adminWritingTaskEditorSchema,
  writingTaskRouteIdSchema,
  type AdminWritingTaskCommandResult,
  type AdminWritingTaskDetail,
} from "@/features/writing-tasks/model/admin-writing-tasks"
import { getServerAdminRequestOptions } from "@/server/http/admin-api-request-options"
import {
  invalidAdminRequestFailure,
  settleAdminApiRequest,
  unauthenticatedAdminRequestFailure,
  type AdminRequestError,
  type AdminRequestResult,
} from "@/shared/http/admin-api-client"
import {
  createAdminWritingTask,
  getAdminWritingTask,
  publishAdminWritingTask,
  saveAdminWritingTask,
} from "@workspace/http-client/admin"

export async function createAdminWritingTaskAction() {
  const requestOptions = await getServerAdminRequestOptions()
  if (requestOptions === null) return unauthenticatedAdminRequestFailure()

  const result = await settleAdminApiRequest(
    createAdminWritingTask(requestOptions)
  )
  if (result.status === "ok") revalidatePath("/writing-tasks")
  return result
}

export async function saveAdminWritingTaskAction(
  writingTaskId: string,
  input: unknown
): Promise<AdminWritingTaskCommandResult> {
  const parsedId = writingTaskRouteIdSchema.safeParse(writingTaskId)
  const document = adminWritingTaskEditorSchema.safeParse(input)
  if (!parsedId.success || !document.success) {
    return invalidAdminRequestFailure()
  }

  const requestOptions = await getServerAdminRequestOptions({
    headers: { "If-Match": `"${document.data.editVersion}"` },
  })
  if (requestOptions === null) return unauthenticatedAdminRequestFailure()

  const result = await settleAdminApiRequest(
    saveAdminWritingTask(parsedId.data, document.data, requestOptions)
  )

  if (result.status === "error") {
    return resolveWritingTaskCommandFailure(parsedId.data, result.error)
  }

  revalidateWritingTaskPaths(parsedId.data)
  return result
}

export async function publishAdminWritingTaskAction(
  writingTaskId: string,
  editVersion: unknown
): Promise<AdminWritingTaskCommandResult> {
  const parsedId = writingTaskRouteIdSchema.safeParse(writingTaskId)
  const parsedVersion = zNonNegativeInteger(editVersion)
  if (!parsedId.success || parsedVersion === null) {
    return invalidAdminRequestFailure()
  }

  const requestOptions = await getServerAdminRequestOptions({
    headers: { "If-Match": `"${parsedVersion}"` },
  })
  if (requestOptions === null) return unauthenticatedAdminRequestFailure()

  const result = await settleAdminApiRequest(
    publishAdminWritingTask(parsedId.data, requestOptions)
  )

  if (result.status === "error") {
    return resolveWritingTaskCommandFailure(parsedId.data, result.error)
  }

  const latest = await loadLatestWritingTask(parsedId.data)
  revalidateWritingTaskPaths(parsedId.data)
  return latest
}

async function resolveWritingTaskCommandFailure(
  writingTaskId: string,
  error: AdminRequestError
): Promise<AdminWritingTaskCommandResult> {
  if (error.code !== "WRITING_TASK_VERSION_CONFLICT") {
    return { error, status: "error" }
  }

  const latest = await loadLatestWritingTask(writingTaskId)
  return latest.status === "ok"
    ? { latest: latest.value, status: "conflict" }
    : latest
}

async function loadLatestWritingTask(
  writingTaskId: string
): Promise<AdminRequestResult<AdminWritingTaskDetail>> {
  const requestOptions = await getServerAdminRequestOptions()
  if (requestOptions === null) return unauthenticatedAdminRequestFailure()

  return settleAdminApiRequest(
    getAdminWritingTask(writingTaskId, requestOptions)
  )
}

function revalidateWritingTaskPaths(writingTaskId: string): void {
  revalidatePath("/writing-tasks")
  revalidatePath(`/writing-tasks/${writingTaskId}`)
}

function zNonNegativeInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : null
}
