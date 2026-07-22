import "server-only"

import { getServerWritingAppApi } from "@/server/http/get-server-writing-app-api"

export async function getLearnerProfile(sessionToken: string) {
  return getServerWritingAppApi({
    tokenProvider: () => sessionToken,
  }).getProfile()
}
