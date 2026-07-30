import type { ReactNode } from "react"
import { getProfile } from "@workspace/http-client/learner"

import { AppShell } from "@/app/(learner)/app/_views/app-shell"
import {
  isLearnerApiAuthenticationError,
  settleLearnerApiRequest,
} from "@/shared/http/learner-api-client"
import { getServerLearnerRequestOptions } from "@/server/http/learner-api-client"

export const dynamic = "force-dynamic"

export default async function AppLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const requestOptions = await getServerLearnerRequestOptions({
    cache: "no-store",
  })
  if (requestOptions === null) return children

  const profileResult = await settleLearnerApiRequest(
    getProfile(requestOptions)
  )
  if (
    profileResult.status === "error" &&
    isLearnerApiAuthenticationError(profileResult.error)
  ) {
    return children
  }

  return <AppShell>{children}</AppShell>
}
