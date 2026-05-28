import * as React from "react"

import type { AdminEditorLessonDetailDto } from "@workspace/core/admin"

export type StepFormProps = {
  lessonSteps: AdminEditorLessonDetailDto["steps"]
  onUpdateContent?: (key: string, value: string) => void
  step: AdminEditorLessonDetailDto["steps"][number]
}

type StepFormField = {
  key: string
  label: string
  type?: "array" | "number" | "text"
}

export function createStepForm(type: string, fields: StepFormField[]) {
  return function StepForm({ onUpdateContent, step }: StepFormProps) {
    return (
      <section aria-label={`${type} 편집`} className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-sm font-medium">{type} 편집</h2>
          <p className="text-xs text-muted-foreground">{step.title}</p>
        </div>
        <div className="grid gap-4">
          {fields.map((field) => (
            <label key={field.key} className="grid gap-2 text-sm">
              {field.label}
              {field.type === "number" ? (
                <input
                  className="h-9 rounded-md border bg-background px-3"
                  defaultValue={String(getNumberField(step.content, field.key))}
                  inputMode="numeric"
                  onChange={(event) =>
                    onUpdateContent?.(field.key, event.currentTarget.value)
                  }
                />
              ) : (
                <textarea
                  className="min-h-20 rounded-md border bg-background px-3 py-2"
                  defaultValue={getFieldValue(step.content, field)}
                  onChange={(event) =>
                    onUpdateContent?.(field.key, event.currentTarget.value)
                  }
                />
              )}
            </label>
          ))}
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

function getFieldValue(content: unknown, field: StepFormField) {
  if (field.type === "array") {
    return getArrayField(content, field.key)
      .map((item) => String(item))
      .join("\n")
  }

  return getTextField(content, field.key)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}
