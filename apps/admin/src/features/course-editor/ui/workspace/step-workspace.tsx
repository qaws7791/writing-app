"use client"

import { useId, useRef, useState } from "react"
import {
  lessonStepTypeSchema,
  lessonStepTypeValues,
  type LessonStepType,
} from "@workspace/contracts/content/steps"
import { lessonStepIdSchema } from "@workspace/contracts/content/ids"

import { LearnerStepPreview } from "@/features/course-editor/ui/learner-step-preview"
import { PlusIcon, TrashIcon } from "@workspace/ui/components/icons"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@workspace/ui/components/ui/alert-dialog"
import { Button } from "@workspace/ui/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/ui/card"
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

import {
  createEditorStep,
  type EditorStep,
} from "@/features/course-editor/model/editor-step"
import { renderStepForm } from "@/features/course-editor/ui/step-forms/step-form-registry"
import type { StepFormProps } from "@/features/course-editor/ui/step-forms/shared/step-form-contract"

const stepTypeItems = lessonStepTypeValues.map((type) => ({
  label: type,
  value: type,
}))

export function StepWorkspace({
  assetUpload,
  onAdd,
  onChange,
  onDuplicate,
  onMove,
  onRemove,
  steps,
}: {
  readonly assetUpload: StepFormProps<EditorStep["type"]>["assetUpload"]
  readonly onAdd: (step: EditorStep) => void
  readonly onChange: (step: EditorStep) => void
  readonly onDuplicate: (step: EditorStep) => void
  readonly onMove: (step: EditorStep, direction: "down" | "up") => void
  readonly onRemove: (step: EditorStep) => void
  readonly steps: readonly EditorStep[]
}) {
  const stepTypeControlId = useId()
  const [removeTarget, setRemoveTarget] = useState<EditorStep | null>(null)
  const [stepType, setStepType] = useState<LessonStepType>("READING")
  const workspaceRef = useRef<HTMLDivElement>(null)
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
    <Card
      ref={workspaceRef}
      aria-label="스텝 편집 작업대"
      className="mt-3 gap-0 py-0"
      role="group"
      tabIndex={-1}
    >
      <CardHeader className="border-b py-5">
        <CardTitle>
          <h2>스텝 편집</h2>
        </CardTitle>
        <CardDescription>
          확정 스텝 타입의 content를 편집합니다.
        </CardDescription>
      </CardHeader>
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
            <SelectTrigger id={stepTypeControlId}>
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
                  aria-label={`${step.type} 스텝 복제`}
                  onClick={() => onDuplicate(step)}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  복제
                </Button>
                <Button
                  aria-label={`${step.type} 스텝 삭제`}
                  onClick={() => setRemoveTarget(step)}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <TrashIcon aria-hidden="true" size={14} />
                </Button>
              </div>
              {renderStepForm(step, onChange, assetUpload)}
              <details className="rounded-3xl bg-muted p-4">
                <summary className="cursor-pointer font-bold">
                  학습자 화면 미리보기
                </summary>
                <div
                  aria-label={`${step.type} 스텝 학습자 미리보기`}
                  className="mt-3"
                  role="group"
                >
                  <LearnerStepPreview step={step} />
                </div>
              </details>
            </li>
          ))}
        </ol>
      )}
      <AlertDialog
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null)
        }}
        open={removeTarget !== null}
      >
        {removeTarget === null ? null : (
          <AlertDialogContent>
            <AlertDialogTitle>스텝을 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              {removeTarget.type} 스텝을 현재 레슨에서 삭제합니다.
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  const step = removeTarget
                  setRemoveTarget(null)
                  onRemove(step)
                  requestAnimationFrame(() => workspaceRef.current?.focus())
                }}
                variant="destructive"
              >
                스텝 삭제
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </Card>
  )
}
