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
  ChevronRight,
  GripVertical,
  MoreHorizontal,
  Pencil,
  Plus,
} from "lucide-react"

import type { AdminEditorCurriculumDetailDto } from "@workspace/core/admin"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/ui/popover"

import { getNodeStatusLabel } from "@/features/courses/course-editor/editor-labels"

type Chapter = AdminEditorCurriculumDetailDto["chapters"][number]
type Lesson = Chapter["lessons"][number]

type CurriculumMapProps = {
  chapters: AdminEditorCurriculumDetailDto["chapters"]
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
    field: "title",
    value: string
  ) => void
}

type CurriculumMapContextValue = {
  isReadOnly: boolean
  onAddLesson?: (chapterId: string) => void
  onArchiveChapter?: (chapterId: string) => void
  onArchiveLesson?: (lessonId: string) => void
  onSelectLesson?: (lessonId: string) => void
  onUpdateChapterField?: (
    chapterId: string,
    field: "title",
    value: string
  ) => void
  selectedLessonId: string | null
}

const CurriculumMapContext =
  React.createContext<CurriculumMapContextValue | null>(null)

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
  const contextValue = React.useMemo<CurriculumMapContextValue>(
    () => ({
      isReadOnly,
      onAddLesson,
      onArchiveChapter,
      onArchiveLesson,
      onSelectLesson,
      onUpdateChapterField,
      selectedLessonId,
    }),
    [
      isReadOnly,
      onAddLesson,
      onArchiveChapter,
      onArchiveLesson,
      onSelectLesson,
      onUpdateChapterField,
      selectedLessonId,
    ]
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
    <section className="space-y-2" aria-labelledby="curriculum-map">
      <h2
        id="curriculum-map"
        className="text-xs font-semibold text-muted-foreground"
      >
        커리큘럼
      </h2>
      <CurriculumMapContext.Provider value={contextValue}>
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="space-y-1">
            {chapters.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                챕터를 추가하세요
              </p>
            ) : (
              chapters.map((chapter) => (
                <ChapterSection key={chapter.id} chapter={chapter} />
              ))
            )}
          </div>
        </DndContext>
        {!isReadOnly && (
          <button
            type="button"
            className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={onAddChapter}
          >
            <Plus aria-hidden="true" className="size-3.5" />
            챕터 추가
          </button>
        )}
      </CurriculumMapContext.Provider>
    </section>
  )
}

type ChapterSectionProps = {
  chapter: Chapter
}

function ChapterSection({ chapter }: ChapterSectionProps) {
  const {
    isReadOnly,
    onAddLesson,
    onArchiveChapter,
    onUpdateChapterField,
    selectedLessonId,
  } = useCurriculumMapContext()
  const [isOpen, setIsOpen] = React.useState(true)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="group flex items-center gap-1 rounded-md py-0.5 pr-1">
        <CollapsibleTrigger
          aria-label={`${chapter.title} 챕터 펼치기`}
          className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ChevronRight
            aria-hidden="true"
            className={`size-3.5 transition-transform${isOpen ? " rotate-90" : ""}`}
          />
        </CollapsibleTrigger>
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {chapter.title}
        </span>
        {!isReadOnly && (
          <Popover>
            <PopoverTrigger
              aria-label={`${chapter.title} 챕터 편집`}
              className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
            >
              <Pencil aria-hidden="true" className="size-3.5" />
            </PopoverTrigger>
            <PopoverContent side="bottom" align="end" className="w-56 gap-3">
              <p className="text-sm font-medium">챕터 편집</p>
              <div className="space-y-3">
                <label className="grid gap-1.5 text-xs text-muted-foreground">
                  제목
                  <input
                    aria-label={`${chapter.title} 챕터 제목`}
                    className="rounded-md border bg-background px-2 py-1.5 text-sm text-foreground"
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
                <div className="border-t pt-2">
                  <button
                    type="button"
                    aria-label={`${chapter.title} 챕터 보관`}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                    onClick={() => onArchiveChapter?.(chapter.id)}
                  >
                    <Archive aria-hidden="true" className="size-3.5" />
                    챕터 보관
                  </button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
      <CollapsibleContent>
        <SortableContext
          items={chapter.lessons.map((lesson) => lesson.lessonId)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-0.5 border-l pl-3">
            {chapter.lessons.length === 0 && (
              <p className="py-2 pl-1 text-xs text-muted-foreground">
                이 챕터에 레슨을 추가하세요
              </p>
            )}
            {chapter.lessons.map((lesson) => (
              <SortableLessonButton
                key={lesson.id}
                isSelected={lesson.lessonId === selectedLessonId}
                lesson={lesson}
              />
            ))}
            {!isReadOnly && (
              <button
                type="button"
                aria-label={`${chapter.title} 레슨 추가`}
                className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => onAddLesson?.(chapter.id)}
              >
                <Plus aria-hidden="true" className="size-3" />
                레슨 추가
              </button>
            )}
          </div>
        </SortableContext>
      </CollapsibleContent>
    </Collapsible>
  )
}

type SortableLessonButtonProps = {
  isSelected: boolean
  lesson: Lesson
}

function SortableLessonButton({
  isSelected,
  lesson,
}: SortableLessonButtonProps) {
  const { isReadOnly, onArchiveLesson, onSelectLesson } =
    useCurriculumMapContext()
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
      className="group flex items-center gap-0.5"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      {!isReadOnly && (
        <button
          ref={setActivatorNodeRef}
          type="button"
          aria-label={`${lesson.title} 순서 변경`}
          title={`${lesson.title} 순서 변경`}
          className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
          {...attributes}
          {...listeners}
        >
          <GripVertical aria-hidden="true" className="size-3.5" />
        </button>
      )}
      <button
        type="button"
        aria-label={`${lesson.title} ${getNodeStatusLabel(lesson.status)}`}
        aria-current={isSelected ? "true" : undefined}
        className="min-w-0 flex-1 truncate rounded-md px-2 py-1.5 text-left text-sm transition hover:bg-muted aria-current:bg-muted aria-current:font-medium"
        onClick={() => onSelectLesson?.(lesson.lessonId)}
      >
        {lesson.title}
      </button>
      {!isReadOnly && (
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={`${lesson.title} 메뉴`}
            className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
          >
            <MoreHorizontal aria-hidden="true" className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start">
            <DropdownMenuItem
              aria-label={`${lesson.title} 레슨 보관`}
              onClick={() => onArchiveLesson?.(lesson.lessonId)}
            >
              <Archive className="size-4" />
              레슨 보관
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}

function useCurriculumMapContext() {
  const context = React.useContext(CurriculumMapContext)

  if (!context) {
    throw new Error(
      "useCurriculumMapContext must be used within CurriculumMap."
    )
  }

  return context
}
