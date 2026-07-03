import type { AdminCourseDetail } from "@/lib/api/admin-api"
import { SectionHeader } from "@workspace/ui/components/ui/section-header"
import { Surface } from "@workspace/ui/components/ui/surface"

export function CurriculumMap({
  course,
}: {
  readonly course: AdminCourseDetail
}) {
  return (
    <Surface variant="panel">
      <SectionHeader
        title="커리큘럼"
        description="유닛과 레슨 배치를 확인합니다."
      />
      <ol className="grid list-none gap-3 p-0">
        {course.units.map((unit) => (
          <li
            className="grid gap-2 rounded-card border border-border/50 bg-background p-3"
            key={unit.id}
          >
            <strong className="text-body-sm font-black text-foreground">
              {unit.title}
            </strong>
            <ol className="grid list-none gap-1 p-0">
              {unit.lessons.map((lesson) => (
                <li
                  className="rounded-control bg-surface px-2.5 py-2 text-label-sm font-semibold text-muted-foreground"
                  key={lesson.id}
                >
                  {lesson.title}
                </li>
              ))}
            </ol>
          </li>
        ))}
      </ol>
    </Surface>
  )
}
