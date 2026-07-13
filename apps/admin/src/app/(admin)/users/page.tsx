import { AdminUsersPage } from "@/features/users/admin-users-page"
import {
  deleteAdminUserAction,
  updateAdminUserStatusAction,
} from "@/features/users/admin-user-actions"
import {
  createAdminUsersApi,
  type ReadAdminUsersInput,
} from "@/features/users/admin-users-api"
import { getServerAdminHttpTransport } from "@/lib/api/get-server-admin-http-transport"
import { getServerAdminSessionToken } from "@/lib/auth/server-admin-session-token"
import { learnerAccountStatusSchema } from "@workspace/contracts/status"

export default async function AdminUsersRoute({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const resolvedSearchParams = await searchParams
  const filters = readUserFilters(resolvedSearchParams)
  const api = createAdminUsersApi(
    getServerAdminHttpTransport({
      tokenProvider: getServerAdminSessionToken,
    })
  )
  const usersResult = await api.getUsers(filters)

  return (
    <AdminUsersPage
      deleteUser={deleteAdminUserAction}
      filters={filters}
      updateUserStatus={updateAdminUserStatusAction}
      usersResult={usersResult}
    />
  )
}

function readUserFilters(
  searchParams: Record<string, string | string[] | undefined>
): ReadAdminUsersInput {
  return {
    page: readPositiveInteger(searchParams["page"], 1),
    pageSize: readPositiveInteger(searchParams["pageSize"], 20),
    query: readString(searchParams["query"], ""),
    sort: readUserSort(readString(searchParams["sort"], "lastActive")),
    status: readUserStatus(readString(searchParams["status"], "all")),
  }
}

function readString(value: string | string[] | undefined, fallback: string) {
  return typeof value === "string" ? value : fallback
}

function readPositiveInteger(
  value: string | string[] | undefined,
  fallback: number
) {
  const parsed = Number(readString(value, ""))

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function readUserSort(value: string): ReadAdminUsersInput["sort"] {
  return value === "joined" || value === "lessonsDone" || value === "streak"
    ? value
    : "lastActive"
}

function readUserStatus(value: string): ReadAdminUsersInput["status"] {
  const status = learnerAccountStatusSchema.safeParse(value)

  return status.success ? status.data : "all"
}
