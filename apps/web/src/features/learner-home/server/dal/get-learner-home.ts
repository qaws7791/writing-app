import { getServerWritingAppApi } from "@/server/http/get-server-writing-app-api"

export async function getLearnerHome(sessionToken: string) {
  const api = getServerWritingAppApi({
    tokenProvider: () => sessionToken,
  })

  const [profileResult, inProgressResult] = await Promise.all([
    api.getProfile(),
    api.getProgress({ status: "in_progress" }),
  ])

  return { inProgressResult, profileResult } as const
}
