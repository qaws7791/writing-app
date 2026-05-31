import { HomePage } from "@/features/home/home-page"
import { createInProgressCourseFromProgress } from "@/features/home/home-data"
import { getServerWritingAppApi } from "@/lib/api/get-server-writing-app-api"

export default async function Page() {
  const api = await getServerWritingAppApi()
  const progress = await api.listProgress()

  if (progress.status === "error") {
    throw new Error(progress.error.message)
  }

  const courses = progress.value.courses.map(createInProgressCourseFromProgress)

  return <HomePage courses={courses} />
}
