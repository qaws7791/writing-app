import { redirect } from "next/navigation"

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ category?: string | string[] }>
}) {
  await redirectToAppCourses(searchParams)
}

async function redirectToAppCourses(
  searchParams: Promise<{ category?: string | string[] }>
) {
  const category = (await searchParams).category
  const categoryParam = Array.isArray(category) ? category[0] : category
  const suffix = categoryParam
    ? `?category=${encodeURIComponent(categoryParam)}`
    : ""

  redirect(`/app/courses${suffix}`)
}
