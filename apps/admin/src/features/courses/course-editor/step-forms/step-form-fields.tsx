import * as React from "react"

import type { AdminEditorStepType } from "@workspace/core/admin"

import {
  getStepDisplayTitle,
  getStepTypeLabel,
} from "@/features/courses/course-editor/editor-labels"
import type { CourseEditorStep } from "@/features/courses/course-editor/editor-state"

export type StepFormProps = {
  isReadOnly?: boolean
  lessonSteps: CourseEditorStep[]
  onUpdateContent?: (key: string, value: unknown) => void
  step: CourseEditorStep
}

type StepFormContent<TType extends AdminEditorStepType> = Extract<
  CourseEditorStep,
  { type: TType }
>["content"]

type StepFormContentKey<TType extends AdminEditorStepType> = Extract<
  keyof StepFormContent<TType>,
  string
>

export type StepFormField<TType extends AdminEditorStepType> = {
  key: StepFormContentKey<TType>
  label: string
  type?: "boolean" | "json" | "number" | "step-select" | "string-array" | "text"
}

export function createStepForm<TType extends AdminEditorStepType>(
  type: TType,
  fields: StepFormField<TType>[]
) {
  return function StepForm({
    isReadOnly = false,
    lessonSteps,
    onUpdateContent,
    step,
  }: StepFormProps) {
    const stepTypeLabel = getStepTypeLabel(type)

    return (
      <section aria-label={`${stepTypeLabel} 편집`} className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-sm font-medium">{stepTypeLabel} 편집</h2>
          <p className="text-xs text-muted-foreground">
            {getStepDisplayTitle(step)}
          </p>
        </div>
        <div className="grid gap-4">
          {fields.map((field) => {
            const fieldValue = getRecordField(step.content, field.key)

            if (field.type === "boolean") {
              return (
                <label
                  key={field.key}
                  className="flex items-center gap-2 text-sm"
                >
                  <input
                    checked={fieldValue === true}
                    className="size-4"
                    disabled={isReadOnly}
                    type="checkbox"
                    onChange={(event) =>
                      onUpdateContent?.(field.key, event.currentTarget.checked)
                    }
                  />
                  {field.label}
                </label>
              )
            }

            if (field.type === "number") {
              return (
                <label key={field.key} className="grid gap-2 text-sm">
                  {field.label}
                  <input
                    className="h-9 rounded-md border bg-background px-3"
                    defaultValue={String(
                      getNumberField(step.content, field.key)
                    )}
                    disabled={isReadOnly}
                    inputMode="numeric"
                    onChange={(event) =>
                      onUpdateContent?.(
                        field.key,
                        Number(event.currentTarget.value)
                      )
                    }
                  />
                </label>
              )
            }

            if (field.type === "step-select") {
              return (
                <label key={field.key} className="grid gap-2 text-sm">
                  {field.label}
                  <select
                    className="h-9 rounded-md border bg-background px-3"
                    defaultValue={getTextField(step.content, field.key)}
                    disabled={isReadOnly}
                    onChange={(event) =>
                      onUpdateContent?.(field.key, event.currentTarget.value)
                    }
                  >
                    <option value="">선택 안 함</option>
                    {lessonSteps
                      .filter((lessonStep) => lessonStep.id !== step.id)
                      .map((lessonStep) => (
                        <option key={lessonStep.id} value={lessonStep.id}>
                          {getStepDisplayTitle(lessonStep)}
                        </option>
                      ))}
                  </select>
                </label>
              )
            }

            return (
              <label key={field.key} className="grid gap-2 text-sm">
                {field.label}
                <textarea
                  className="min-h-20 rounded-md border bg-background px-3 py-2"
                  defaultValue={getFieldValue(step.content, field)}
                  disabled={isReadOnly}
                  onChange={(event) =>
                    onUpdateContent?.(
                      field.key,
                      parseFieldValue(field, event.currentTarget.value)
                    )
                  }
                />
              </label>
            )
          })}
        </div>
      </section>
    )
  }
}

export function getTextField(content: unknown, key: string): string {
  return isRecord(content) && typeof content[key] === "string"
    ? content[key]
    : ""
}

export function getNumberField(content: unknown, key: string): number {
  return isRecord(content) && typeof content[key] === "number"
    ? content[key]
    : 0
}

export function getArrayField(content: unknown, key: string): unknown[] {
  return isRecord(content) && Array.isArray(content[key]) ? content[key] : []
}

function getFieldValue<TType extends AdminEditorStepType>(
  content: unknown,
  field: StepFormField<TType>
) {
  if (field.type === "json") {
    const value = getRecordField(content, field.key)

    return value === undefined ? "" : JSON.stringify(value, null, 2)
  }

  if (field.type === "string-array") {
    return getArrayField(content, field.key)
      .map((item) => String(item))
      .join("\n")
  }

  return getTextField(content, field.key)
}

function parseFieldValue<TType extends AdminEditorStepType>(
  field: StepFormField<TType>,
  rawValue: string
) {
  if (field.type === "json") {
    try {
      return JSON.parse(rawValue) as unknown
    } catch {
      return rawValue
    }
  }

  if (field.type === "string-array") {
    return rawValue
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
  }

  return rawValue
}

function getRecordField(content: unknown, key: string): unknown {
  return isRecord(content) ? content[key] : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}
