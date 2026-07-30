import {
  lessonIdSchema,
  lessonStepIdSchema,
  unitIdSchema,
} from "@workspace/contracts/content/ids"

import type { AdminCourseDetail } from "@/features/course-editor/model/admin-course-editor"
import {
  createContentAssetUpload,
  type UploadAdminContentAsset,
} from "@/features/course-editor/model/content-asset-upload"
import type { CourseEditorAction } from "@/features/course-editor/model/course-editor-reducer"
import type { ConfirmationIntent } from "@/features/course-editor/ui/confirmation-copy"
import { StepWorkspace } from "@/features/course-editor/ui/workspace/step-workspace"
import { PlusIcon, TrashIcon } from "@workspace/ui/components/icons"
import { Button } from "@workspace/ui/components/ui/button"
import { Field, FieldLabel } from "@workspace/ui/components/ui/field"
import { Input } from "@workspace/ui/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/ui/select"

type EditorUnit = AdminCourseDetail["units"][number]
type EditorLesson = EditorUnit["lessons"][number]
type LessonStepId = EditorLesson["steps"][number]["id"]

export function CourseCurriculumTab({
  dispatch,
  draft,
  lessonCount,
  requestConfirmation,
  uploadAdminContentAsset,
}: {
  readonly dispatch: (action: CourseEditorAction) => void
  readonly draft: AdminCourseDetail
  readonly lessonCount: number
  readonly requestConfirmation: (intent: ConfirmationIntent) => void
  readonly uploadAdminContentAsset: UploadAdminContentAsset
}) {
  const uploadAsset = createContentAssetUpload({
    dispatch,
    draft,
    uploadAdminContentAsset,
  })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-[0.875rem] font-medium text-muted-foreground">
          유닛 {draft.units.length}개 · 레슨 {lessonCount}개
        </p>
        <Button
          onClick={() =>
            dispatch({
              type: "unit-added",
              unitId: unitIdSchema.parse(`unit_${crypto.randomUUID()}`),
            })
          }
          type="button"
        >
          <PlusIcon aria-hidden="true" size={15} /> 유닛 추가
        </Button>
      </div>
      <div className="flex flex-col gap-6">
        {draft.units.map((unit, unitIndex) => (
          <section key={unit.id}>
            <div className="mb-2 flex items-center gap-3">
              <span className="text-xs font-bold text-muted-foreground">
                UNIT {unitIndex + 1}
              </span>
              <div className="h-px flex-1 bg-surface-hover" />
              <Button
                aria-label={`${unit.title} 유닛 삭제`}
                onClick={() =>
                  requestConfirmation({
                    type: "remove-unit",
                    unitId: unit.id,
                    unitTitle: unit.title,
                  })
                }
                size="icon"
                variant="ghost"
              >
                <TrashIcon aria-hidden="true" size={15} />
              </Button>
            </div>
            <Input
              aria-label={`유닛 ${unitIndex + 1} 제목`}
              className="mb-3 font-bold"
              onChange={(event) =>
                dispatch({
                  title: event.target.value,
                  type: "unit-title-changed",
                  unitId: unit.id,
                })
              }
              value={unit.title}
            />
            <div className="flex flex-col gap-2">
              {unit.lessons.map((lesson, lessonIndex) => (
                <div className="grid gap-2" key={lesson.id}>
                  <div className="flex items-center gap-2">
                    <span className="w-6 text-sm font-bold text-muted-foreground">
                      {lessonIndex + 1}
                    </span>
                    <Input
                      aria-label={`${unit.title} 레슨 ${lessonIndex + 1} 제목`}
                      onChange={(event) =>
                        dispatch({
                          lessonId: lesson.id,
                          title: event.target.value,
                          type: "lesson-title-changed",
                          unitId: unit.id,
                        })
                      }
                      value={lesson.title}
                    />
                    <span className="whitespace-nowrap text-xs text-muted-foreground">
                      스텝 {lesson.steps.length}개
                    </span>
                    <Button
                      aria-label={`${lesson.title} 레슨 삭제`}
                      onClick={() =>
                        requestConfirmation({
                          lessonId: lesson.id,
                          lessonTitle: lesson.title,
                          type: "remove-lesson",
                          unitId: unit.id,
                        })
                      }
                      size="icon"
                      variant="ghost"
                    >
                      <TrashIcon aria-hidden="true" size={14} />
                    </Button>
                  </div>
                  <AiFeedbackTargetFields
                    lesson={lesson}
                    onTargetChange={(stepId, targetStepId) => {
                      const step = lesson.steps.find(
                        (candidate) => candidate.id === stepId
                      )
                      if (step?.type !== "AI_FEEDBACK") return
                      dispatch({
                        lessonId: lesson.id,
                        step: { ...step, target: targetStepId },
                        type: "step-changed",
                        unitId: unit.id,
                      })
                    }}
                  />
                  <StepWorkspace
                    assetUpload={{
                      assets: draft.assets,
                      disabled: false,
                      upload: uploadAsset,
                    }}
                    onAdd={(step) =>
                      dispatch({
                        lessonId: lesson.id,
                        step,
                        type: "step-added",
                        unitId: unit.id,
                      })
                    }
                    onChange={(step) =>
                      dispatch({
                        lessonId: lesson.id,
                        step,
                        type: "step-changed",
                        unitId: unit.id,
                      })
                    }
                    onMove={(step, direction) =>
                      dispatch({
                        direction,
                        lessonId: lesson.id,
                        stepId: step.id,
                        type: "step-moved",
                        unitId: unit.id,
                      })
                    }
                    onRemove={(step) =>
                      dispatch({
                        lessonId: lesson.id,
                        stepId: step.id,
                        type: "step-removed",
                        unitId: unit.id,
                      })
                    }
                    steps={lesson.steps}
                  />
                </div>
              ))}
              <Button
                className="self-start"
                onClick={() =>
                  dispatch({
                    lessonId: lessonIdSchema.parse(
                      `lesson_${crypto.randomUUID()}`
                    ),
                    type: "lesson-added",
                    unitId: unit.id,
                  })
                }
                type="button"
                variant="ghost"
              >
                <PlusIcon aria-hidden="true" size={15} /> 레슨 추가
              </Button>
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

function AiFeedbackTargetFields({
  lesson,
  onTargetChange,
}: {
  readonly lesson: EditorLesson
  readonly onTargetChange: (
    stepId: LessonStepId,
    targetStepId: LessonStepId
  ) => void
}) {
  const aiSteps = lesson.steps.filter((step) => step.type === "AI_FEEDBACK")

  if (aiSteps.length === 0) return null

  return (
    <div className="ml-8 grid gap-3 rounded-2xl bg-surface p-3">
      {aiSteps.map((aiStep) => {
        const targets = lesson.steps
          .filter(
            (step) => step.type === "WRITE" && step.sortOrder < aiStep.sortOrder
          )
          .map((step) => ({
            label: `${step.sortOrder}. ${getWriteStepLabel(step)}`,
            value: step.id,
          }))
        const inputId = `${aiStep.id}-target-step`

        return (
          <Field key={aiStep.id}>
            <FieldLabel htmlFor={inputId}>AI 코칭 대상 쓰기 스텝</FieldLabel>
            <Select
              items={targets}
              onValueChange={(value) => {
                if (value === null) return
                onTargetChange(
                  lessonStepIdSchema.parse(aiStep.id),
                  lessonStepIdSchema.parse(value)
                )
              }}
              value={aiStep.target}
            >
              <SelectTrigger id={inputId}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {targets.map((target) => (
                  <SelectItem key={target.value} value={target.value}>
                    {target.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )
      })}
    </div>
  )
}

function getWriteStepLabel(step: EditorLesson["steps"][number]): string {
  if (step.type !== "WRITE") return "쓰기"
  return step.title ?? step.prompt ?? "쓰기"
}
