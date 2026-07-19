import { getBrowserWritingAppApi } from "@/shared/http/get-browser-writing-app-api"
import type { WritingAppApi } from "@/shared/http/writing-app-api-port"

export type LessonSessionApi = Pick<
  WritingAppApi,
  "completeStep" | "requestAiFeedback" | "startLesson"
>

export function getBrowserLessonSessionApi(): LessonSessionApi {
  return getBrowserWritingAppApi({ tokenProvider: () => null })
}
