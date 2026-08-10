import { courseCategoryValues } from "@workspace/contracts/content/category"

export type CourseCategoryGroup<TCourse extends { readonly category: string }> =
  {
    readonly category: string
    readonly courses: readonly TCourse[]
  }

export function groupCoursesByCategory<
  TCourse extends { readonly category: string },
>(courses: readonly TCourse[]): readonly CourseCategoryGroup<TCourse>[] {
  const buckets = new Map<string, TCourse[]>()

  for (const course of courses) {
    const category = course.category
    const existing = buckets.get(category)
    if (existing === undefined) {
      buckets.set(category, [course])
      continue
    }
    existing.push(course)
  }

  const knownOrder = new Map<string, number>(
    courseCategoryValues.map((category, index) => [category, index])
  )
  const knownSections: CourseCategoryGroup<TCourse>[] = []
  const unknownSections: CourseCategoryGroup<TCourse>[] = []

  for (const [category, groupedCourses] of buckets) {
    const section = { category, courses: groupedCourses }
    if (knownOrder.has(category)) {
      knownSections.push(section)
      continue
    }
    unknownSections.push(section)
  }

  knownSections.sort(
    (left, right) =>
      (knownOrder.get(left.category) ?? 0) -
      (knownOrder.get(right.category) ?? 0)
  )
  unknownSections.sort((left, right) =>
    left.category.localeCompare(right.category, "ko")
  )

  return [...knownSections, ...unknownSections]
}
