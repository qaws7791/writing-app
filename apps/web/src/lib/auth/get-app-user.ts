import type { CurrentUser, WritingAppApi } from "@/lib/api/writing-app-api"

export async function getAppUser(
  api: Pick<WritingAppApi, "getCurrentUser">
): Promise<CurrentUser | null> {
  const currentUser = await api.getCurrentUser()

  if (currentUser.status === "error") {
    return null
  }

  return currentUser.value
}
