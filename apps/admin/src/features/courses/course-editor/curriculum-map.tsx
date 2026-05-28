"use client"

import * as React from "react"
import { closestCenter, DndContext, type DragEndEvent } from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import type { AdminEditorCurriculumVersionDetailDto } from "@workspace/core/admin"

type CurriculumMapProps = {
  chapters: AdminEditorCurriculumVersionDetailDto["chapters"]
  selectedLessonId: string | null
  onSelectLesson?: (lessonId: string) => void
  onMoveLesson?: (lessonId: string, targetIndex: number) => void
}

export function CurriculumMap({
  chapters,
  selectedLessonId,
  onSelectLesson,
  onMoveLesson,
}: CurriculumMapProps) {
  const flatLessons = chapters.flatMap((chapter) => chapter.lessons)

  function handleDragEnd(event: DragEndEvent) {
    if (!event.over || event.active.id === event.over.id) {
      return
    }

    const lessonId = String(event.active.id)
    const targetIndex = flatLessons.findIndex(
      (lesson) => lesson.lessonId === event.over?.id
    )

    if (targetIndex >= 0) {
      onMoveLesson?.(lessonId, targetIndex)
    }
  }

  return (
    <section className="space-y-3" aria-labelledby="curriculum-map">
      <div className="flex items-center justify-between gap-3">
        <h2
          id="curriculum-map"
          className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase"
        >
          Curriculum
        </h2>
        <span className="text-xs text-muted-foreground">
          {flatLessons.length} lessons
        </span>
      </div>
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="space-y-5">
          {chapters.map((chapter) => (
            <div key={chapter.id} className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-medium">{chapter.title}</h3>
                <span className="text-xs text-muted-foreground">
                  {chapter.status}
                </span>
              </div>
              <SortableContext
                items={chapter.lessons.map((lesson) => lesson.lessonId)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1 border-l pl-3">
                  {chapter.lessons.map((lesson) => (
                    <SortableLessonButton
                      key={lesson.id}
                      isSelected={lesson.lessonId === selectedLessonId}
                      lesson={lesson}
                      onSelectLesson={onSelectLesson}
                    />
                  ))}
                </div>
              </SortableContext>
            </div>
          ))}
        </div>
      </DndContext>
    </section>
  )
}

type SortableLessonButtonProps = {
  isSelected: boolean
  lesson: AdminEditorCurriculumVersionDetailDto["chapters"][number]["lessons"][number]
  onSelectLesson?: (lessonId: string) => void
}

function SortableLessonButton({
  isSelected,
  lesson,
  onSelectLesson,
}: SortableLessonButtonProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: lesson.lessonId })

  return (
    <button
      ref={setNodeRef}
      type="button"
      aria-current={isSelected ? "true" : undefined}
      className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition hover:bg-muted aria-current:bg-muted aria-current:text-foreground"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      onClick={() => onSelectLesson?.(lesson.lessonId)}
      {...attributes}
      {...listeners}
    >
      <span className="min-w-0 truncate">{lesson.title}</span>
      <span className="ml-3 text-xs text-muted-foreground">
        {lesson.status}
      </span>
    </button>
  )
}
