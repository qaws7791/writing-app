import { cookies } from "next/headers"

import {
  learnerSessionCookieName,
  normalizeLearnerSessionToken,
} from "@/shared/auth/session-token"

export async function getServerLearnerSessionToken(): Promise<null | string> {
  const cookieStore = await cookies()

  return normalizeLearnerSessionToken(
    cookieStore.get(learnerSessionCookieName)?.value
  )
}
