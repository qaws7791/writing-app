import {
  writingDifficultyValues,
  writingDomainValues,
  writingTaskIdSchema,
} from "@workspace/contracts/writing/writing"
import { adminWritingTaskWriteDocumentSchema } from "@workspace/contracts/writing/admin-writing-tasks"
import type {
  createAdminWritingTask,
  getAdminWritingTask,
  getAdminWritingTasks,
} from "@workspace/http-client/admin"
import type { AdminRequestError } from "@/shared/http/admin-api-client"

export type ReadAdminWritingTasksInput = {
  readonly domain: "all" | (typeof writingDomainValues)[number]
  readonly page: number
  readonly pageSize: number
  readonly query: string
  readonly status: "all" | "draft" | "published"
}

export type AdminWritingTaskList = Awaited<
  ReturnType<typeof getAdminWritingTasks>
>
export type AdminWritingTaskDetail = Awaited<
  ReturnType<typeof getAdminWritingTask>
>
export type AdminCreatedWritingTask = Awaited<
  ReturnType<typeof createAdminWritingTask>
>

export type AdminWritingTaskCommandResult =
  | Readonly<{
      latest: AdminWritingTaskDetail
      status: "conflict"
    }>
  | Readonly<{
      error: AdminRequestError
      status: "error"
    }>
  | Readonly<{
      status: "ok"
      value: AdminWritingTaskDetail
    }>

export const adminWritingTaskEditorSchema = adminWritingTaskWriteDocumentSchema
export const writingTaskRouteIdSchema = writingTaskIdSchema
export const writingTaskDomainOptions = writingDomainValues
export const writingTaskDifficultyOptions = writingDifficultyValues
