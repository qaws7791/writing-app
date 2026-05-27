import * as React from "react"
import { ChevronDownIcon } from "lucide-react"

import type { AdminCourseTreeDto } from "@workspace/core/admin"
import { Badge } from "@workspace/ui/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/ui/collapsible"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/ui/empty"

type AdminCoursesPageProps = {
  courses: AdminCourseTreeDto["courses"]
}

export function AdminCoursesPage({ courses }: AdminCoursesPageProps) {
  return (
    <main className="flex flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-normal">콘텐츠</h1>
        <p className="text-sm text-muted-foreground">
          코스, 챕터, 레슨 계층을 읽기 전용으로 확인합니다.
        </p>
      </header>

      {courses.length === 0 ? (
        <Empty
          aria-label="코스 없음"
          className="rounded-lg border"
          role="status"
        >
          <EmptyHeader>
            <EmptyTitle>등록된 코스가 없습니다.</EmptyTitle>
            <EmptyDescription>
              어드민 API에서 조회된 콘텐츠 계층이 없습니다.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-4">
          {courses.map((course) => (
            <Card
              className="rounded-lg"
              key={course.id}
              size="sm"
              variant="outlined"
            >
              <CardHeader className="rounded-t-lg">
                <CardTitle>{course.title}</CardTitle>
                <CardDescription>{course.description}</CardDescription>
                <CardAction className="flex items-center gap-2">
                  <Badge variant="outline">코스 {course.sortOrder}</Badge>
                  <Badge variant="secondary">
                    챕터 {course.chapters.length}개
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardContent>
                {course.chapters.length === 0 ? (
                  <p className="rounded-md border border-dashed bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                    등록된 챕터가 없습니다.
                  </p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {course.chapters.map((chapter) => (
                      <Collapsible defaultOpen key={chapter.id}>
                        <div className="rounded-lg border bg-background">
                          <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
                            <span className="flex min-w-0 items-center gap-2">
                              <Badge variant="outline">{chapter.label}</Badge>
                              <span className="truncate text-sm font-medium">
                                {chapter.title}
                              </span>
                            </span>
                            <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                              레슨 {chapter.lessons.length}개
                              <ChevronDownIcon className="size-4" />
                            </span>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            {chapter.lessons.length === 0 ? (
                              <div className="border-t p-3">
                                <p className="rounded-md border border-dashed bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                                  등록된 레슨이 없습니다.
                                </p>
                              </div>
                            ) : (
                              <ul className="flex flex-col gap-2 border-t p-3">
                                {chapter.lessons.map((lesson) => (
                                  <li
                                    className="flex flex-col gap-1 rounded-md bg-muted/40 p-3"
                                    key={lesson.id}
                                  >
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline">
                                        레슨 {lesson.sortOrder}
                                      </Badge>
                                      <span className="text-sm font-medium">
                                        {lesson.title}
                                      </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      {lesson.description}
                                    </p>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  )
}
