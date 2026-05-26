import { redirect } from "next/navigation"

type CoursePageProps = {
  params: Promise<{ id: string }>
}

export default async function Page({ params }: CoursePageProps) {
  const { id } = await params

  redirect(`/app/courses/${id}`)
}
