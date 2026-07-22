import "server-only"

import { cookies } from "next/headers"
import { normalizeLearnerSessionToken } from "@workspace/auth/session-token"
import { learnerSessionCookieName } from "@workspace/contracts/auth-session-cookie"

export async function getServerLearnerSessionToken(): Promise<null | string> {
  const cookieStore = await cookies()

  return normalizeLearnerSessionToken(
    cookieStore.get(learnerSessionCookieName)?.value
  )
}
