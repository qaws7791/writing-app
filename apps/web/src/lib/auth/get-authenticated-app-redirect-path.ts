import { getSafeNextPath } from "@/lib/auth/auth-navigation"
import { getAppUser } from "@/lib/auth/get-app-user"
import type { WritingAppApi } from "@/lib/api/writing-app-api"

export async function getAuthenticatedAppRedirectPath(
  api: Pick<WritingAppApi, "getCurrentUser">,
  nextPath: string | undefined
): Promise<string | null> {
  const currentUser = await getAppUser(api)

  if (!currentUser) {
    return null
  }

  return getSafeNextPath(nextPath)
}
