"use client"

import { useId, useState } from "react"
import {
  lessonStepTypeSchema,
  lessonStepTypeValues,
  type LessonStepType,
} from "@workspace/contracts/content/steps"
import { lessonStepIdSchema } from "@workspace/contracts/content/ids"
import { PlusIcon, TrashIcon } from "@workspace/ui/components/icons"
import { Button } from "@workspace/ui/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@workspace/ui/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/ui/select"
import { SectionHeader } from "@workspace/ui/components/ui/section-header"
import { Surface } from "@workspace/ui/components/ui/surface"

import {
  createEditorStep,
  type EditorStep,
} from "@/features/course-editor/model/editor-step"
import { renderStepForm } from "@/features/course-editor/ui/step-forms/step-form-registry"

const stepTypeItems = lessonStepTypeValues.map((type) => ({
  label: type,
  value: type,
}))

export function StepWorkspace({
  onAdd,
  onChange,
  onMove,
  onRemove,
  steps,
}: {
  readonly onAdd: (step: EditorStep) => void
  readonly onChange: (step: EditorStep) => void
  readonly onMove: (step: EditorStep, direction: "down" | "up") => void
  readonly onRemove: (step: EditorStep) => void
  readonly steps: readonly EditorStep[]
}) {
  const stepTypeControlId = useId()
  const [stepType, setStepType] = useState<LessonStepType>("READING")
  const targetWriteStep = [...steps]
    .reverse()
    .find((step) => step.type === "WRITE")
  const cannotAddAiFeedback =
    stepType === "AI_FEEDBACK" && targetWriteStep === undefined

  const addStep = () => {
    const id = lessonStepIdSchema.parse(`step_${crypto.randomUUID()}`)
    const sortOrder = steps.length + 1
    onAdd(
      stepType === "AI_FEEDBACK"
        ? createEditorStep({
            id,
            sortOrder,
            targetStepId: targetWriteStep?.id ?? id,
            type: stepType,
          })
        : createEditorStep({ id, sortOrder, type: stepType })
    )
  }

  return (
    <Surface className="mt-3" variant="panel">
      <SectionHeader
        description="확정 스텝 타입의 content를 편집합니다."
        title="스텝 편집"
      />
      <div className="grid gap-3 border-b border-border/50 p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <Field>
          <FieldLabel htmlFor={stepTypeControlId}>추가할 스텝 타입</FieldLabel>
          <Select
            items={stepTypeItems}
            onValueChange={(value) => {
              if (value !== null) setStepType(lessonStepTypeSchema.parse(value))
            }}
            value={stepType}
          >
            <SelectTrigger id={stepTypeControlId} variant="outlined">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {stepTypeItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {cannotAddAiFeedback ? (
            <FieldDescription>
              AI 피드백보다 앞선 쓰기 스텝을 먼저 추가해 주세요.
            </FieldDescription>
          ) : null}
        </Field>
        <Button
          disabled={cannotAddAiFeedback}
          onClick={addStep}
          type="button"
          variant="outline"
        >
          <PlusIcon aria-hidden="true" size={15} /> 스텝 추가
        </Button>
      </div>
      {steps.length === 0 ? (
        <p className="p-4 text-sm text-muted-foreground">스텝이 없습니다.</p>
      ) : (
        <ol aria-label="스텝 편집 폼" className="grid list-none gap-4 p-4">
          {steps.map((step, index) => (
            <li className="grid gap-2" key={step.id}>
              <div
                aria-label={`${step.type} 스텝 순서와 삭제`}
                className="flex justify-end gap-2"
                role="group"
              >
                <Button
                  disabled={index === 0}
                  onClick={() => onMove(step, "up")}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  위로
                </Button>
                <Button
                  disabled={index === steps.length - 1}
                  onClick={() => onMove(step, "down")}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  아래로
                </Button>
                <Button
                  aria-label={`${step.type} 스텝 삭제`}
                  onClick={() => {
                    if (window.confirm("이 스텝을 삭제할까요?")) onRemove(step)
                  }}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <TrashIcon aria-hidden="true" size={14} />
                </Button>
              </div>
              {renderStepForm(step, onChange)}
            </li>
          ))}
        </ol>
      )}
    </Surface>
  )
}
