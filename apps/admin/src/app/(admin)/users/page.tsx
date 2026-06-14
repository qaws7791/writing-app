import { AdminUsersPage } from "@/features/users/admin-users-page"
import { getServerAdminApi } from "@/lib/api/get-server-admin-api"
import type { ReadAdminUsersInput } from "@/lib/api/admin-api"
import { getServerAdminSessionToken } from "@/lib/auth/server-admin-session-token"

export default async function AdminUsersRoute({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const resolvedSearchParams = await searchParams
  const filters = readUserFilters(resolvedSearchParams)
  const api = getServerAdminApi({
    tokenProvider: getServerAdminSessionToken,
  })
  const usersResult = await api.getUsers(filters)

  async function updateUserStatus(input: {
    readonly status: "active" | "suspended"
    readonly userId: string
  }) {
    "use server"

    const serverApi = getServerAdminApi({
      tokenProvider: getServerAdminSessionToken,
    })

    return serverApi.updateUserStatus(input)
  }

  async function deleteUser(userId: string) {
    "use server"

    const serverApi = getServerAdminApi({
      tokenProvider: getServerAdminSessionToken,
    })

    return serverApi.deleteUser(userId)
  }

  return (
    <AdminUsersPage
      deleteUser={deleteUser}
      filters={filters}
      updateUserStatus={updateUserStatus}
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
  return value === "active" || value === "suspended" || value === "deleted"
    ? value
    : "all"
}
