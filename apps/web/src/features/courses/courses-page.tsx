import { courseCategories } from "@/features/courses/course-data"
import { CourseFeed } from "@/features/courses/course-feed"

export function CoursesPage() {
  return (
    <div className="w-full bg-background text-foreground">
      <div className="mx-auto flex max-w-6xl flex-col px-4 pt-6 pb-12 sm:px-6 sm:pt-9 md:px-8 md:pt-12 md:pb-20">
        <header className="mb-8 flex flex-col gap-2 md:mb-12">
          <h1 className="m-0 text-3xl/9 font-bold tracking-normal md:text-4xl/10">
            학습 코스 둘러보기
          </h1>
          <p className="m-0 max-w-2xl text-base/7 text-muted-foreground md:text-lg/8">
            체계적인 커리큘럼으로 한국어 글쓰기 실력을 키워보세요.
          </p>
        </header>

        <CourseFeed categories={courseCategories} />
      </div>
    </div>
  )
}
