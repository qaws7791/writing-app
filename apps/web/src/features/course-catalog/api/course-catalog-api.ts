import { getBrowserWritingAppApi } from "@/shared/http/get-browser-writing-app-api"
import type { WritingAppApi } from "@/shared/http/writing-app-api-port"

export type CourseCatalogApi = Pick<WritingAppApi, "listCourses">

export function getBrowserCourseCatalogApi(): CourseCatalogApi {
  return getBrowserWritingAppApi({ tokenProvider: () => null })
}
