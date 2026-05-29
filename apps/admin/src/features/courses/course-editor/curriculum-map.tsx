"use client"

import * as React from "react"
import { closestCenter, DndContext, type DragEndEvent } from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  Archive,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Plus,
} from "lucide-react"

import type { AdminEditorCurriculumVersionDetailDto } from "@workspace/core/admin"

import { getNodeStatusLabel } from "@/features/courses/course-editor/editor-labels"

type CurriculumMapProps = {
  chapters: AdminEditorCurriculumVersionDetailDto["chapters"]
  isReadOnly?: boolean
  onAddChapter?: () => void
  onAddLesson?: (chapterId: string) => void
  onArchiveChapter?: (chapterId: string) => void
  onArchiveLesson?: (lessonId: string) => void
  selectedLessonId: string | null
  onSelectLesson?: (lessonId: string) => void
  onMoveLesson?: (lessonId: string, targetIndex: number) => void
  onUpdateChapterField?: (
    chapterId: string,
    field: "label" | "title",
    value: string
  ) => void
}

export function CurriculumMap({
  chapters,
  isReadOnly = false,
  onAddChapter,
  onAddLesson,
  onArchiveChapter,
  onArchiveLesson,
  selectedLessonId,
  onSelectLesson,
  onMoveLesson,
  onUpdateChapterField,
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
          className="text-xs font-semibold text-muted-foreground"
        >
          커리큘럼
        </h2>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isReadOnly}
          onClick={onAddChapter}
        >
          <Plus aria-hidden="true" className="size-3.5" />
          챕터 추가
        </button>
      </div>
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="space-y-5">
          {chapters.map((chapter) => (
            <div key={chapter.id} className="space-y-2">
              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="grid min-w-0 flex-1 gap-1 text-sm">
                    <span className="sr-only">{chapter.title} 챕터 제목</span>
                    <input
                      aria-label={`${chapter.title} 챕터 제목`}
                      className="min-w-0 rounded-md border bg-background px-2 py-1.5 font-medium disabled:cursor-not-allowed disabled:opacity-70"
                      disabled={isReadOnly}
                      value={chapter.title}
                      onChange={(event) =>
                        onUpdateChapterField?.(
                          chapter.id,
                          "title",
                          event.currentTarget.value
                        )
                      }
                    />
                  </label>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {getNodeStatusLabel(chapter.status)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isReadOnly}
                    onClick={() => onAddLesson?.(chapter.id)}
                  >
                    <Plus aria-hidden="true" className="size-3.5" />
                    {chapter.title} 레슨 추가
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isReadOnly}
                    onClick={() => onArchiveChapter?.(chapter.id)}
                  >
                    <Archive aria-hidden="true" className="size-3.5" />
                    {chapter.title} 챕터 보관
                  </button>
                </div>
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
                      isReadOnly={isReadOnly}
                      lesson={lesson}
                      onArchiveLesson={onArchiveLesson}
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
  isReadOnly: boolean
  lesson: AdminEditorCurriculumVersionDetailDto["chapters"][number]["lessons"][number]
  onArchiveLesson?: (lessonId: string) => void
  onMoveLesson?: (lessonId: string, targetIndex: number) => void
  onSelectLesson?: (lessonId: string) => void
}

function SortableLessonButton({
  canMoveDown,
  canMoveUp,
  index,
  isSelected,
  isReadOnly,
  lesson,
  onArchiveLesson,
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
      className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-1"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <button
        type="button"
        aria-label={`${lesson.title} ${getNodeStatusLabel(lesson.status)}`}
        aria-current={isSelected ? "true" : undefined}
        className="flex min-w-0 items-center justify-between rounded-md px-3 py-2 text-left text-sm transition hover:bg-muted aria-current:bg-muted aria-current:text-foreground"
        onClick={() => onSelectLesson?.(lesson.lessonId)}
      >
        <span className="min-w-0 truncate">{lesson.title}</span>
        <span className="ml-3 text-xs text-muted-foreground">
          {getNodeStatusLabel(lesson.status)}
        </span>
      </button>
      <button
        type="button"
        aria-label={`${lesson.title} 위로 이동`}
        className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
        disabled={isReadOnly || !canMoveUp}
        onClick={() => onMoveLesson?.(lesson.lessonId, index - 1)}
      >
        <ChevronUp aria-hidden="true" className="size-4" />
      </button>
      <button
        type="button"
        aria-label={`${lesson.title} 아래로 이동`}
        className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
        disabled={isReadOnly || !canMoveDown}
        onClick={() => onMoveLesson?.(lesson.lessonId, index + 1)}
      >
        <ChevronDown aria-hidden="true" className="size-4" />
      </button>
      <button
        type="button"
        aria-label={`${lesson.title} 레슨 보관`}
        className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
        disabled={isReadOnly}
        onClick={() => onArchiveLesson?.(lesson.lessonId)}
      >
        <Archive aria-hidden="true" className="size-4" />
      </button>
      <button
        ref={setActivatorNodeRef}
        type="button"
        aria-label={`${lesson.title} 순서 변경`}
        title={`${lesson.title} 순서 변경`}
        className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
        disabled={isReadOnly}
        {...attributes}
        {...listeners}
      >
        <GripVertical aria-hidden="true" className="size-4" />
      </button>
    </div>
  )
}
