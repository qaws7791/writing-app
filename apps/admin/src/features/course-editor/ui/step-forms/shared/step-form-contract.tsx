"use client"

import { useState } from "react"
import { Badge } from "@workspace/ui/components/primitives/badge"
import {
  Field,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/primitives/field"
import { Input } from "@workspace/ui/components/primitives/input"
import { Textarea } from "@workspace/ui/components/primitives/textarea"
import { adminCourseEditorStepSchema } from "@workspace/contracts/content/admin-courses"
import type {
  AdminContentAsset,
  AdminContentAssetKind,
} from "@/features/course-editor/model/admin-course-editor"

import type { EditorStep } from "@/features/course-editor/model/editor-step"
import type { AdminRequestResult } from "@/shared/http/admin-api-client"

export type StepFormProps<TType extends EditorStep["type"]> = {
  readonly assetUpload: {
    readonly assets: readonly AdminContentAsset[]
    readonly disabled: boolean
    readonly upload: (input: {
      readonly altText: string
      readonly file: File
      readonly kind: AdminContentAssetKind
    }) => Promise<AdminRequestResult<AdminContentAsset>>
  }
  readonly onChange: (
    step: Extract<EditorStep, { readonly type: TType }>
  ) => void
  readonly step: Extract<EditorStep, { readonly type: TType }>
}

export function parseEditorStepChange(
  step: EditorStep,
  patch: Readonly<Record<string, unknown>>
): EditorStep | null {
  const result = adminCourseEditorStepSchema.safeParse({ ...step, ...patch })
  return result.success ? (result.data as EditorStep) : null
}

export function StepFormShell({
  children,
  step,
}: {
  readonly children: React.ReactNode
  readonly step: EditorStep
}) {
  return (
    <article className="grid gap-4 rounded-3xl border border-border/70 bg-card p-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <Badge variant="secondary">{step.type}</Badge>
        <span className="text-xs font-semibold text-muted-foreground">
          {step.id}
        </span>
      </header>
      {children}
    </article>
  )
}

export function StepTextField({
  id,
  label,
  multiline = false,
  onChange,
  value,
}: {
  readonly id: string
  readonly label: string
  readonly multiline?: boolean
  readonly onChange: (value: string) => void
  readonly value: string | undefined
}) {
  const controlProps = {
    id,
    onChange: (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => onChange(event.target.value),
    value: value ?? "",
  }

  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {multiline ? <Textarea {...controlProps} /> : <Input {...controlProps} />}
    </Field>
  )
}

export function StepBooleanField({
  checked,
  id,
  label,
  onChange,
}: {
  readonly checked: boolean
  readonly id: string
  readonly label: string
  readonly onChange: (checked: boolean) => void
}) {
  return (
    <Field orientation="horizontal">
      <input
        checked={checked}
        className="size-4"
        id={id}
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
    </Field>
  )
}

export function StepJsonField({
  id,
  label,
  onCommit,
  value,
}: {
  readonly id: string
  readonly label: string
  readonly onCommit: (value: unknown) => boolean
  readonly value: unknown
}) {
  const canonicalValue = JSON.stringify(value, null, 2)
  return (
    <StepJsonFieldControl
      canonicalValue={canonicalValue}
      id={id}
      key={canonicalValue}
      label={label}
      onCommit={onCommit}
    />
  )
}

function StepJsonFieldControl({
  canonicalValue,
  id,
  label,
  onCommit,
}: {
  readonly canonicalValue: string
  readonly id: string
  readonly label: string
  readonly onCommit: (value: unknown) => boolean
}) {
  const [draft, setDraft] = useState(canonicalValue)
  const [error, setError] = useState<string | null>(null)

  const commit = () => {
    try {
      const parsed: unknown = JSON.parse(draft)
      if (!onCommit(parsed)) {
        setError("스텝 계약에 맞는 JSON 값을 입력해 주세요.")
        return
      }
      setError(null)
    } catch {
      setError("유효한 JSON 값을 입력해 주세요.")
    }
  }

  return (
    <Field data-invalid={error === null ? undefined : true}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Textarea
        aria-invalid={error === null ? undefined : true}
        className="min-h-28 font-mono"
        id={id}
        onBlur={commit}
        onChange={(event) => setDraft(event.target.value)}
        value={draft}
      />
      <FieldError>{error}</FieldError>
    </Field>
  )
}
