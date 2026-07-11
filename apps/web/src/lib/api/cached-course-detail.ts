import { cache } from "react"

import { getServerWritingAppApi } from "@/lib/api/get-server-writing-app-api"

export const getCachedCourseDetail = cache(
  async (courseId: string, sessionToken: string) => {
    const api = getServerWritingAppApi({
      tokenProvider: () => sessionToken,
    })

    return api.getCourseDetail(courseId)
  }
)
