import type { CurriculumVersionId } from "@workspace/types/ids"

export function createCurriculumVersionId(
  courseId: string,
  revision: number
): CurriculumVersionId {
  return `curriculum:${courseId}:${revision}` as CurriculumVersionId
}
