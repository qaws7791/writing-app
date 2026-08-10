import {
  CourseCatalogClient,
  type CoursesPageProps,
} from "@/features/course-catalog/ui/course-catalog-client"

export function CoursesPage(props: CoursesPageProps) {
  return (
    <div className="@container flex w-full flex-col gap-12">
      <header
        aria-labelledby="courses-catalog-title"
        className="flex max-w-xl flex-col gap-2"
      >
        <h1
          className="font-heading text-3xl font-semibold tracking-[-0.04em] text-balance sm:text-4xl sm:leading-[1.15]"
          id="courses-catalog-title"
        >
          코스
        </h1>
        <p className="text-sm leading-6 text-pretty text-muted-foreground sm:text-[0.9375rem]">
          주제별로 코스를 살펴보세요
        </p>
      </header>
      <CourseCatalogClient {...props} />
    </div>
  )
}
