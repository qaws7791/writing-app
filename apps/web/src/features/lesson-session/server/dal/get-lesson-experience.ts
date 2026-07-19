import { getServerWritingAppApi } from "@/server/http/get-server-writing-app-api"

export async function getLessonExperience({
  lessonId,
  sessionToken,
}: {
  readonly lessonId: string
  readonly sessionToken: string
}) {
  const api = getServerWritingAppApi({
    tokenProvider: () => sessionToken,
  })

  const [lessonResult, profileResult] = await Promise.all([
    api.getLesson(lessonId),
    api.getProfile(),
  ])

  return { lessonResult, profileResult } as const
}
