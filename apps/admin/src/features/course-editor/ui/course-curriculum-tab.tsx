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
import type {
  CourseEditorAction,
  LessonFieldChange,
} from "@/features/course-editor/model/course-editor-reducer"
import {
  readLessonSummaryLines,
  readOptionalLessonText,
} from "@/features/course-editor/model/lesson-field-input"
import type { ConfirmationIntent } from "@/features/course-editor/ui/confirmation-copy"
import { StepWorkspace } from "@/features/course-editor/ui/workspace/step-workspace"
import { PlusIcon, TrashIcon } from "@workspace/ui/components/icons"
import { Button } from "@workspace/ui/components/ui/button"
import { Card, CardContent } from "@workspace/ui/components/ui/card"
import { Field, FieldLabel } from "@workspace/ui/components/ui/field"
import { Input } from "@workspace/ui/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/ui/select"
import { Textarea } from "@workspace/ui/components/ui/textarea"

type EditorUnit = AdminCourseDetail["units"][number]
type EditorLesson = EditorUnit["lessons"][number]
type LessonStepId = EditorLesson["steps"][number]["id"]

function createLessonId() {
  return lessonIdSchema.parse(`lesson_${crypto.randomUUID()}`)
}

function createStepId() {
  return lessonStepIdSchema.parse(`step_${crypto.randomUUID()}`)
}

function unitMoveItems(
  units: readonly EditorUnit[],
  currentUnitId: EditorUnit["id"]
) {
  return units
    .filter((unit) => unit.id !== currentUnitId)
    .map((unit) => ({ label: `${unit.title}(으)로 이동`, value: unit.id }))
}

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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">
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
              <div className="h-px flex-1 bg-border" />
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
                <Card
                  className="gap-3"
                  key={lesson.id}
                  size="sm"
                  variant="muted"
                >
                  <CardContent className="grid gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="w-6 text-sm font-bold text-muted-foreground">
                        {lessonIndex + 1}
                      </span>
                      <Input
                        aria-label={`${unit.title} 레슨 ${lessonIndex + 1} 제목`}
                        className="min-w-48 flex-1"
                        onChange={(event) =>
                          dispatch({
                            change: {
                              field: "title",
                              value: event.target.value,
                            },
                            lessonId: lesson.id,
                            type: "lesson-changed",
                            unitId: unit.id,
                          })
                        }
                        value={lesson.title}
                      />
                      <span className="whitespace-nowrap text-xs text-muted-foreground">
                        스텝 {lesson.steps.length}개
                      </span>
                    </div>
                    <div
                      aria-label={`${lesson.title} 레슨 순서와 작업`}
                      className="flex flex-wrap items-center gap-2"
                      role="group"
                    >
                      <Button
                        aria-label={`${lesson.title} 레슨 위로 이동`}
                        disabled={lessonIndex === 0}
                        onClick={() =>
                          dispatch({
                            direction: "up",
                            lessonId: lesson.id,
                            type: "lesson-moved",
                            unitId: unit.id,
                          })
                        }
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        위로
                      </Button>
                      <Button
                        aria-label={`${lesson.title} 레슨 아래로 이동`}
                        disabled={lessonIndex === unit.lessons.length - 1}
                        onClick={() =>
                          dispatch({
                            direction: "down",
                            lessonId: lesson.id,
                            type: "lesson-moved",
                            unitId: unit.id,
                          })
                        }
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        아래로
                      </Button>
                      <Button
                        aria-label={`${lesson.title} 레슨 복제`}
                        onClick={() =>
                          dispatch({
                            lessonId: lesson.id,
                            newLessonId: createLessonId(),
                            newStepIds: lesson.steps.map(() => createStepId()),
                            type: "lesson-duplicated",
                            unitId: unit.id,
                          })
                        }
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        복제
                      </Button>
                      {draft.units.length < 2 ? null : (
                        <Select
                          items={unitMoveItems(draft.units, unit.id)}
                          onValueChange={(value) => {
                            if (value === null) return
                            dispatch({
                              lessonId: lesson.id,
                              targetUnitId: unitIdSchema.parse(value),
                              type: "lesson-unit-changed",
                              unitId: unit.id,
                            })
                          }}
                          value=""
                        >
                          <SelectTrigger
                            aria-label={`${lesson.title} 레슨 유닛 이동`}
                            className="w-36"
                            size="sm"
                          >
                            <SelectValue placeholder="유닛 이동" />
                          </SelectTrigger>
                          <SelectContent>
                            {unitMoveItems(draft.units, unit.id).map((item) => (
                              <SelectItem key={item.value} value={item.value}>
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
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
                    <LessonInfoFields
                      lesson={lesson}
                      onChange={(change) =>
                        dispatch({
                          change,
                          lessonId: lesson.id,
                          type: "lesson-changed",
                          unitId: unit.id,
                        })
                      }
                    />
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
                      onDuplicate={(step) =>
                        dispatch({
                          lessonId: lesson.id,
                          newStepId: createStepId(),
                          stepId: step.id,
                          type: "step-duplicated",
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
                  </CardContent>
                </Card>
              ))}
              <Button
                className="self-start"
                onClick={() =>
                  dispatch({
                    lessonId: createLessonId(),
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

function LessonInfoFields({
  lesson,
  onChange,
}: {
  readonly lesson: EditorLesson
  readonly onChange: (change: LessonFieldChange) => void
}) {
  return (
    <div className="grid gap-4 rounded-3xl border border-border/70 bg-card p-4 md:grid-cols-2">
      <Field>
        <FieldLabel htmlFor={`${lesson.id}-category`}>카테고리</FieldLabel>
        <Input
          id={`${lesson.id}-category`}
          onChange={(event) =>
            onChange({
              field: "category",
              value: readOptionalLessonText(event.target.value),
            })
          }
          value={lesson.category ?? ""}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor={`${lesson.id}-estimated-minutes`}>
          예상 시간(분)
        </FieldLabel>
        <Input
          id={`${lesson.id}-estimated-minutes`}
          inputMode="numeric"
          min={1}
          onChange={(event) =>
            onChange({
              field: "estimatedMinutes",
              value: Number(event.target.value),
            })
          }
          type="number"
          value={lesson.estimatedMinutes}
        />
      </Field>
      <Field className="md:col-span-2">
        <FieldLabel htmlFor={`${lesson.id}-description`}>설명</FieldLabel>
        <Textarea
          id={`${lesson.id}-description`}
          onChange={(event) =>
            onChange({
              field: "description",
              value: readOptionalLessonText(event.target.value),
            })
          }
          rows={2}
          value={lesson.description ?? ""}
        />
      </Field>
      <Field className="md:col-span-2">
        <FieldLabel htmlFor={`${lesson.id}-summary`}>
          완료 화면 핵심 요약 (한 줄에 하나)
        </FieldLabel>
        <Textarea
          id={`${lesson.id}-summary`}
          onChange={(event) =>
            onChange({
              field: "summary",
              value: readLessonSummaryLines(event.target.value),
            })
          }
          rows={3}
          value={lesson.summary.join("\n")}
        />
      </Field>
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
    <div className="grid gap-4 rounded-3xl border border-border/70 bg-card p-4">
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
