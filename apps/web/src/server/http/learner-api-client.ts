import "server-only"

import { cookies } from "next/headers"
import { normalizeLearnerSessionToken } from "@workspace/auth/session-token"
import { learnerSessionCookieName } from "@workspace/contracts/auth-session-cookie"
import { createGeneratedRequestOptions } from "@workspace/http-client/generated-fetch"

import { readServerApiBaseUrl } from "@/server/env/runtime-config"

export async function getServerLearnerRequestOptions(
  options: RequestInit = {}
): Promise<RequestInit | null> {
  const cookieStore = await cookies()
  const sessionToken = normalizeLearnerSessionToken(
    cookieStore.get(learnerSessionCookieName)?.value
  )
  if (sessionToken === null) return null

  return createGeneratedRequestOptions(
    {
      baseUrl: readServerApiBaseUrl(),
      cookie: `${learnerSessionCookieName}=${encodeURIComponent(sessionToken)}`,
    },
    options
  )
}
