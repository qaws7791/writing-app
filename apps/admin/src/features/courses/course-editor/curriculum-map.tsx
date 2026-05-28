"use client"

import * as React from "react"
import { closestCenter, DndContext, type DragEndEvent } from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ChevronDown, ChevronUp, GripVertical } from "lucide-react"

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
  const lessonIndexById = new Map(
    flatLessons.map((lesson, index) => [lesson.lessonId, index])
  )

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
                      canMoveDown={
                        (lessonIndexById.get(lesson.lessonId) ?? 0) <
                        flatLessons.length - 1
                      }
                      canMoveUp={
                        (lessonIndexById.get(lesson.lessonId) ?? 0) > 0
                      }
                      index={lessonIndexById.get(lesson.lessonId) ?? 0}
                      isSelected={lesson.lessonId === selectedLessonId}
                      lesson={lesson}
                      onMoveLesson={onMoveLesson}
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
  canMoveDown: boolean
  canMoveUp: boolean
  index: number
  isSelected: boolean
  lesson: AdminEditorCurriculumVersionDetailDto["chapters"][number]["lessons"][number]
  onMoveLesson?: (lessonId: string, targetIndex: number) => void
  onSelectLesson?: (lessonId: string) => void
}

function SortableLessonButton({
  canMoveDown,
  canMoveUp,
  index,
  isSelected,
  lesson,
  onMoveLesson,
  onSelectLesson,
}: SortableLessonButtonProps) {
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: lesson.lessonId })

  return (
    <div
      ref={setNodeRef}
      className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-1"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <button
        type="button"
        aria-label={`${lesson.title} ${lesson.status}`}
        aria-current={isSelected ? "true" : undefined}
        className="flex min-w-0 items-center justify-between rounded-md px-3 py-2 text-left text-sm transition hover:bg-muted aria-current:bg-muted aria-current:text-foreground"
        onClick={() => onSelectLesson?.(lesson.lessonId)}
      >
        <span className="min-w-0 truncate">{lesson.title}</span>
        <span className="ml-3 text-xs text-muted-foreground">
          {lesson.status}
        </span>
      </button>
      <button
        type="button"
        aria-label={`${lesson.title} 위로 이동`}
        className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
        disabled={!canMoveUp}
        onClick={() => onMoveLesson?.(lesson.lessonId, index - 1)}
      >
        <ChevronUp aria-hidden="true" className="size-4" />
      </button>
      <button
        type="button"
        aria-label={`${lesson.title} 아래로 이동`}
        className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
        disabled={!canMoveDown}
        onClick={() => onMoveLesson?.(lesson.lessonId, index + 1)}
      >
        <ChevronDown aria-hidden="true" className="size-4" />
      </button>
      <button
        ref={setActivatorNodeRef}
        type="button"
        aria-label="레슨 순서 변경"
        title={`${lesson.title} 순서 변경`}
        className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical aria-hidden="true" className="size-4" />
      </button>
    </div>
  )
}
