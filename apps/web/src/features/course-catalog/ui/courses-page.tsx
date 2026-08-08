import {
  CourseCatalogClient,
  type CoursesPageProps,
} from "@/features/course-catalog/ui/course-catalog-client"

export function CoursesPage(props: CoursesPageProps) {
  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
        무엇을 써볼까요?
      </h1>
      <p className="mt-3 mb-9 max-w-2xl text-base leading-7 text-muted-foreground">
        관심 있는 주제를 골라 매일 한 단락씩 글의 결을 다듬어 보세요.
      </p>
      <CourseCatalogClient {...props} />
    </div>
  )
}
