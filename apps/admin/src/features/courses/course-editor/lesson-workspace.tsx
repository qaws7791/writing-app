"use client"

import * as React from "react"
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Archive, ChevronDown, Eye, GripVertical, Plus } from "lucide-react"

import type {
  AdminEditorCurriculumDetailDto,
  AdminEditorStepType,
} from "@workspace/core/admin"
import { Button, buttonVariants } from "@workspace/ui/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/ui/dropdown-menu"

import type { EditorChangeKind } from "@/features/courses/course-editor/editor-change-kind"
import {
  formatPointLabel,
  getChangeKindLabel,
  getNodeStatusLabel,
  getStepDisplayTitle,
  getStepTypeLabel,
} from "@/features/courses/course-editor/editor-labels"
import type { CourseEditorStep } from "@/features/courses/course-editor/editor-state"

type LessonSummary =
  AdminEditorCurriculumDetailDto["chapters"][number]["lessons"][number]

type LessonWorkspaceProps = {
  changeKind: EditorChangeKind
  isReadOnly?: boolean
  lesson: LessonSummary | null
  onAddStep?: (type: AdminEditorStepType) => void
  onArchiveStep?: (stepId: string) => void
  onMoveStep?: (stepId: string, targetIndex: number) => void
  onOpenPreview?: () => void
  selectedStepId: string | null
  steps: CourseEditorStep[]
  onSelectStep?: (stepId: string) => void
  onUpdateLessonField?: (
    lessonId: string,
    field: "description" | "title",
    value: string
  ) => void
}

/** 스텝 타입 카테고리 */
const stepTypeGroups: { label: string; types: AdminEditorStepType[] }[] = [
  {
    label: "도입 · 설명",
    types: ["INTRO", "CONCEPT", "READING_PASSAGE", "EXAMPLE_REVEAL", "COMPARE"],
  },
  {
    label: "퀴즈 · 연습",
    types: [
      "MULTIPLE_CHOICE",
      "FILL_BLANK",
      "WORD_SELECT",
      "REORDER",
      "MATCH",
      "CLASSIFY",
    ],
  },
  {
    label: "글쓰기",
    types: [
      "SHORT_WRITE",
      "LONG_WRITE",
      "AI_FEEDBACK",
      "REVISION",
      "TRANSCRIBE",
    ],
  },
  {
    label: "마무리",
    types: ["CHECKLIST", "REFLECTION", "SUMMARY", "COMPLETE"],
  },
]

export function LessonWorkspace({
  changeKind,
  isReadOnly = false,
  lesson,
  onAddStep,
  onArchiveStep,
  onMoveStep,
  onOpenPreview,
  selectedStepId,
  steps,
  onSelectStep,
  onUpdateLessonField,
}: LessonWorkspaceProps) {
  const [showArchived, setShowArchived] = React.useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  if (!lesson) {
    return (
      <section className="rounded-md border bg-background p-6">
        <p className="text-sm text-muted-foreground">
          왼쪽 커리큘럼에서 레슨을 선택하세요.
        </p>
      </section>
    )
  }

  const sortedSteps = [...steps].sort(
    (left, right) => left.sortOrder - right.sortOrder
  )
  const activeSteps = sortedSteps.filter((step) => step.status !== "archived")
  const archivedSteps = sortedSteps.filter((step) => step.status === "archived")

  function handleDragEnd(event: DragEndEvent) {
    if (!event.over || event.active.id === event.over.id) {
      return
    }

    const stepId = String(event.active.id)
    const targetIndex = activeSteps.findIndex(
      (step) => step.id === event.over?.id
    )

    if (targetIndex >= 0) {
      onMoveStep?.(stepId, targetIndex)
    }
  }

  return (
    <section className="flex flex-col gap-8" aria-labelledby="lesson-workspace">
      <div className="flex flex-col gap-4 border-b pb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2 flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground">
              {getNodeStatusLabel(lesson.status)} ·{" "}
              {getChangeKindLabel(changeKind)}
            </p>
            <label className="grid gap-2 text-sm">
              레슨 제목
              <input
                id="lesson-workspace"
                className="rounded-md border bg-background px-3 py-2 text-2xl font-semibold disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isReadOnly}
                value={lesson.title}
                onChange={(event) =>
                  onUpdateLessonField?.(
                    lesson.lessonId,
                    "title",
                    event.currentTarget.value
                  )
                }
              />
            </label>
            <label className="grid max-w-2xl gap-2 text-sm">
              레슨 설명
              <textarea
                className="min-h-20 rounded-md border bg-background px-3 py-2 leading-6 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isReadOnly}
                value={lesson.description}
                onChange={(event) =>
                  onUpdateLessonField?.(
                    lesson.lessonId,
                    "description",
                    event.currentTarget.value
                  )
                }
              />
            </label>
          </div>
          <Button type="button" variant="outline" onClick={onOpenPreview}>
            <Eye aria-hidden="true" />
            미리보기
          </Button>
        </div>
        <div className="rounded-md border bg-background p-4">
          <h3 className="text-sm font-medium">학습 의도</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            이 레슨은 학습자가 {lesson.title} 흐름을 따라 직접 문장을 조립하도록
            설계됩니다.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xs font-semibold tracking-[0.18em] text-muted-foreground">
            학습 흐름
          </h3>
          {!isReadOnly && (
            <DropdownMenu>
              <DropdownMenuTrigger
                className={buttonVariants({ variant: "outline" })}
              >
                <Plus aria-hidden="true" />
                스텝 추가
                <ChevronDown aria-hidden="true" className="ml-1 size-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {stepTypeGroups.map((group, groupIndex) => (
                  <React.Fragment key={group.label}>
                    {groupIndex > 0 && <DropdownMenuSeparator />}
                    <DropdownMenuLabel className="text-xs text-muted-foreground">
                      {group.label}
                    </DropdownMenuLabel>
                    {group.types.map((type) => (
                      <DropdownMenuItem
                        key={type}
                        onClick={() => onAddStep?.(type)}
                      >
                        {getStepTypeLabel(type)}
                      </DropdownMenuItem>
                    ))}
                  </React.Fragment>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={activeSteps.map((step) => step.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {activeSteps.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  스텝을 추가하세요.
                </p>
              )}
              {activeSteps.map((step) => (
                <SortableStepRow
                  key={step.id}
                  isReadOnly={isReadOnly}
                  isSelected={step.id === selectedStepId}
                  step={step}
                  onArchiveStep={onArchiveStep}
                  onSelectStep={onSelectStep}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {archivedSteps.length > 0 && (
          <div className="pt-1">
            <button
              type="button"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setShowArchived((prev) => !prev)}
            >
              <Archive aria-hidden="true" className="size-3.5" />
              보관된 스텝 {archivedSteps.length}개{" "}
              {showArchived ? "숨기기" : "보기"}
            </button>
            {showArchived && (
              <div className="mt-2 space-y-2 opacity-60">
                {archivedSteps.map((step) => {
                  const stepTitle = getStepDisplayTitle(step)
                  return (
                    <div
                      key={step.id}
                      className="grid min-w-0 grid-cols-[104px_1fr_auto] items-center gap-4 rounded-md border bg-background px-4 py-3 text-sm"
                    >
                      <span className="text-xs font-medium text-muted-foreground">
                        {getStepTypeLabel(step.type)}
                      </span>
                      <span className="min-w-0 truncate font-medium line-through">
                        {stepTitle}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        보관됨
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

type StepRowProps = {
  isReadOnly: boolean
  isSelected: boolean
  step: CourseEditorStep
  onArchiveStep?: (stepId: string) => void
  onSelectStep?: (stepId: string) => void
}

function SortableStepRow({
  isReadOnly,
  isSelected,
  step,
  onArchiveStep,
  onSelectStep,
}: StepRowProps) {
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id })

  const stepTitle = getStepDisplayTitle(step)

  return (
    <div
      ref={setNodeRef}
      className={`grid grid-cols-[auto_1fr_auto] items-center gap-1 ${isDragging ? "opacity-50" : ""}`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      {!isReadOnly ? (
        <button
          ref={setActivatorNodeRef}
          type="button"
          aria-label={`${stepTitle} 순서 변경`}
          className="cursor-grab rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical aria-hidden="true" className="size-4" />
        </button>
      ) : (
        <span className="w-7" />
      )}
      <button
        type="button"
        aria-label={`${stepTitle} 스텝 열기`}
        aria-current={isSelected ? "true" : undefined}
        className="grid min-w-0 grid-cols-[104px_1fr_auto] items-center gap-4 rounded-md border bg-background px-4 py-3 text-left text-sm transition hover:bg-muted aria-current:border-foreground"
        onClick={() => onSelectStep?.(step.id)}
      >
        <span className="text-xs font-medium text-muted-foreground">
          {getStepTypeLabel(step.type)}
        </span>
        <span className="min-w-0 truncate font-medium">{stepTitle}</span>
        <span className="text-xs text-muted-foreground">
          {formatPointLabel(step.points)}
        </span>
      </button>
      <button
        type="button"
        aria-label={`${stepTitle} 스텝 보관`}
        className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
        disabled={isReadOnly}
        onClick={() => onArchiveStep?.(step.id)}
      >
        <Archive aria-hidden="true" className="size-4" />
      </button>
    </div>
  )
}
