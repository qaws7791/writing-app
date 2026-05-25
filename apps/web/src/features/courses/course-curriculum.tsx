"use client"

import { useState } from "react"
import Link from "next/link"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/ui/collapsible"
import { Separator } from "@workspace/ui/components/ui/separator"
import {
  CheckCircleIcon,
  CheckIcon,
  ChevronDownIcon,
  CircleIcon,
} from "@workspace/ui/components/icons"
import { cn } from "@workspace/ui/lib/utils"

import type {
  CourseChapter,
  CourseDetail,
  CourseLesson,
  CourseChapterId,
} from "@/features/courses/course-detail-data"

interface CourseCurriculumProps {
  course: CourseDetail
}

export function CourseCurriculum({ course }: CourseCurriculumProps) {
  const [openChapterIds, setOpenChapterIds] = useState<
    readonly CourseChapterId[]
  >(() => [getInitialOpenChapterId(course.chapters)])

  function setChapterOpen(chapterId: CourseChapterId, open: boolean) {
    setOpenChapterIds((current) => {
      if (open) {
        return current.includes(chapterId) ? current : [...current, chapterId]
      }

      return current.filter(
        (currentChapterId) => currentChapterId !== chapterId
      )
    })
  }

  return (
    <section className="w-full" aria-labelledby="course-curriculum-title">
      <div className="mb-10 flex items-baseline justify-between gap-4 px-1">
        <h2
          id="course-curriculum-title"
          className="m-0 text-xl/7 font-semibold tracking-normal"
        >
          커리큘럼
        </h2>
        <span className="shrink-0 text-sm font-medium text-muted-foreground">
          총 {course.chapters.length}단원 · {course.progress.totalLessons}레슨
        </span>
      </div>

      <div className="flex flex-col">
        {course.chapters.map((chapter, index) => {
          const open = openChapterIds.includes(chapter.id)
          const completedLessons = chapter.lessons.filter(
            (lesson) => lesson.completed
          ).length
          const complete = completedLessons === chapter.lessons.length

          return (
            <Collapsible
              key={chapter.id}
              open={open}
              onOpenChange={(nextOpen) => setChapterOpen(chapter.id, nextOpen)}
              className="flex flex-col"
            >
              {index > 0 ? <Separator className="opacity-50" /> : null}
              <article className="mb-8 sm:mb-0">
                <CollapsibleTrigger className="flex min-h-16 w-full items-center justify-between rounded-3xl border-0 bg-transparent px-1 py-3 text-left font-[inherit] text-inherit transition-colors hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-[0.998] sm:p-6">
                  <span className="flex min-w-0 flex-col gap-1.5">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">
                      {chapter.label}
                    </span>
                    <span className="truncate text-lg/7 font-semibold tracking-normal text-foreground">
                      {chapter.title}
                    </span>
                  </span>

                  <span className="flex shrink-0 items-center gap-4">
                    <ChapterStatus
                      complete={complete}
                      completedLessons={completedLessons}
                      totalLessons={chapter.lessons.length}
                    />
                    <span
                      className={cn(
                        "flex size-9 items-center justify-center rounded-full text-muted-foreground transition-transform duration-300",
                        open && "rotate-180"
                      )}
                      aria-hidden="true"
                    >
                      <ChevronDownIcon className="size-5" />
                    </span>
                  </span>
                </CollapsibleTrigger>

                <CollapsibleContent
                  keepMounted
                  className="overflow-hidden transition-[height,opacity] duration-300 ease-out data-[closed]:h-0 data-[closed]:opacity-0 data-[open]:h-[var(--collapsible-panel-height)] data-[open]:opacity-100 data-[starting-style]:h-0 data-[starting-style]:opacity-0"
                >
                  <div className="flex flex-col pt-2.5 pr-0 pb-1.5 pl-1 sm:pl-3">
                    {chapter.lessons.map((lesson) => (
                      <LessonRow key={lesson.id} lesson={lesson} />
                    ))}
                  </div>
                </CollapsibleContent>
              </article>
            </Collapsible>
          )
        })}
      </div>
    </section>
  )
}

function ChapterStatus({
  complete,
  completedLessons,
  totalLessons,
}: {
  complete: boolean
  completedLessons: number
  totalLessons: number
}) {
  return (
    <span
      className={cn(
        "flex items-center gap-1.5 text-sm font-medium text-muted-foreground",
        complete && "text-primary"
      )}
    >
      {complete ? (
        <CheckCircleIcon className="size-4.5" aria-hidden="true" />
      ) : (
        <CheckIcon className="size-4.5" aria-hidden="true" />
      )}
      {complete ? "완료" : `${completedLessons}/${totalLessons}`}
    </span>
  )
}

function LessonRow({ lesson }: { lesson: CourseLesson }) {
  return (
    <Link
      href={`/lesson?lesson_id=${lesson.lessonId}`}
      className="group relative flex min-h-12 w-full items-center gap-3.5 rounded-xl px-3 py-3 text-left transition-colors hover:bg-muted/60 focus-visible:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring sm:px-3.5"
    >
      <span
        className={cn(
          "flex size-6 shrink-0 items-center justify-center transition-transform duration-200 group-hover:translate-x-1",
          lesson.completed ? "text-primary" : "text-muted-foreground"
        )}
        aria-hidden="true"
      >
        {lesson.completed ? (
          <CheckCircleIcon className="size-5" />
        ) : (
          <CircleIcon className="size-5" />
        )}
      </span>
      <span
        className={cn(
          "min-w-0 text-[15px]/6 tracking-normal transition-transform duration-200 group-hover:translate-x-1",
          lesson.completed ? "text-muted-foreground" : "text-foreground/85"
        )}
      >
        {lesson.title}
      </span>
    </Link>
  )
}

function getInitialOpenChapterId(
  chapters: readonly CourseChapter[]
): CourseChapterId {
  const firstChapter = chapters[0]

  if (!firstChapter) {
    throw new Error("Course curriculum must include at least one chapter")
  }

  const nextChapter = chapters.find((chapter) =>
    chapter.lessons.some((lesson) => !lesson.completed)
  )

  return nextChapter?.id ?? firstChapter.id
}
