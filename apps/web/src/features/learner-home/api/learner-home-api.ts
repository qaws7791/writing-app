import { getBrowserWritingAppApi } from "@/shared/http/get-browser-writing-app-api"
import type { WritingAppApi } from "@/shared/http/writing-app-api-port"

export type LearnerHomeApi = Pick<WritingAppApi, "getProgress">

export function getBrowserLearnerHomeApi(): LearnerHomeApi {
  return getBrowserWritingAppApi({ tokenProvider: () => null })
}
