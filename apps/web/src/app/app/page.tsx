import { HomePage } from "@/features/home/home-page"
import { createInProgressCourse } from "@/features/home/home-data"
import { getServerWritingAppApi } from "@/lib/api/get-server-writing-app-api"

export default async function Page() {
  const api = await getServerWritingAppApi()
  const progress = await api.listProgress()

  if (progress.status === "error") {
    throw new Error(progress.error.message)
  }

  const courses = await Promise.all(
    progress.value.courses.map(async (courseProgress) => {
      const course = await api.getCourseDetail(courseProgress.courseId)

      if (course.status === "error") {
        throw new Error(course.error.message)
      }

      return createInProgressCourse(course.value)
    })
  )

  return <HomePage courses={courses} />
}
