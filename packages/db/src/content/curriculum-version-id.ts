export function createCurriculumVersionId(
  courseId: string,
  revision: number
): string {
  return `curriculum:${courseId}:${revision}`
}
