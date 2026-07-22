import type {
  ContentCoursePage,
  ContentRepository,
  ReadContentCoursesInput,
} from "#content/application/ports/content-ports"

export type ListCoursesUseCase = (
  query: ReadContentCoursesInput
) => Promise<ContentCoursePage>

export function createListCoursesUseCase(
  repository: ContentRepository
): ListCoursesUseCase {
  return (query) => repository.readCourses(query)
}
