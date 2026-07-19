import {
  CourseCatalogClient,
  type CoursesPageProps,
} from "@/features/course-catalog/ui/course-catalog-client"

export function CoursesPage(props: CoursesPageProps) {
  return (
    <div>
      <h1 className="mb-4 text-heading-lg font-bold">무엇을 써볼까요?</h1>
      <p className="mb-8 text-body-lg font-medium text-muted-foreground">
        관심 있는 주제를 골라 매일 한 단락씩 글의 결을 다듬어 보세요.
      </p>
      <CourseCatalogClient {...props} />
    </div>
  )
}
