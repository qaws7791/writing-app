"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import type { StepType } from "@workspace/core/modules/journeys"

import { Button } from "@workspace/ui/components/ui/button"
import {
  Field,
  FieldContent,
  FieldLabel,
} from "@workspace/ui/components/ui/field"
import { Input } from "@workspace/ui/components/ui/input"
import { Textarea } from "@workspace/ui/components/ui/textarea"

import {
  finishAdminMutation,
  runAdminMutation,
} from "@/lib/forms/admin-mutation"
import {
  parseStepContentJson,
  serializeStepContentJson,
  stepTypeOptions,
} from "@/lib/forms/step-form-helpers"

type StepFormValues = {
  type: StepType
  order: number
  contentJson: string
}

type Props = {
  journeyId: number
  sessionId: number
  defaultValues?: Partial<{
    type: StepType
    order: number
    contentJson: unknown
  }>
  stepId?: number
}

export function StepForm({
  journeyId,
  sessionId,
  defaultValues,
  stepId,
}: Props) {
  const router = useRouter()
  const isEdit = stepId !== undefined

  const [values, setValues] = useState<StepFormValues>({
    type: defaultValues?.type ?? "INTRO",
    order: defaultValues?.order ?? 1,
    contentJson: defaultValues?.contentJson
      ? serializeStepContentJson(defaultValues.contentJson)
      : "{}",
  })
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const parsedContentJson = parseStepContentJson(values.contentJson)
    if (!parsedContentJson.ok) {
      setError(parsedContentJson.error)
      return
    }

    setIsPending(true)
    try {
      const result = await runAdminMutation({
        body: {
          type: values.type,
          order: values.order,
          contentJson: parsedContentJson.value,
        },
        method: isEdit ? "PUT" : "POST",
        url: isEdit
          ? `/api/journeys/${journeyId}/sessions/${sessionId}/steps/${stepId}`
          : `/api/journeys/${journeyId}/sessions/${sessionId}/steps`,
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      finishAdminMutation(
        router,
        `/journeys/${journeyId}/sessions/${sessionId}`
      )
    } catch {
      setError("서버 오류가 발생했습니다")
    } finally {
      setIsPending(false)
    }
  }

  async function handleDelete() {
    if (!isEdit) return
    if (!confirm("정말 삭제하시겠습니까?")) return
    setIsPending(true)
    try {
      const result = await runAdminMutation({
        method: "DELETE",
        url: `/api/journeys/${journeyId}/sessions/${sessionId}/steps/${stepId}`,
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      finishAdminMutation(
        router,
        `/journeys/${journeyId}/sessions/${sessionId}`
      )
    } catch {
      setError("서버 오류가 발생했습니다")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="step-type" className="label">
            타입
          </label>
          <select
            id="step-type"
            name="type"
            value={values.type}
            onChange={(e) =>
              setValues((prev) => ({
                ...prev,
                type: e.target.value as StepType,
              }))
            }
            className="input input--full-width"
          >
            {stepTypeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <Field>
          <FieldLabel>순서</FieldLabel>
          <FieldContent>
            <Input
              type="number"
              value={String(values.order)}
              onChange={(e) =>
                setValues((prev) => ({
                  ...prev,
                  order: Number(e.target.value) || prev.order,
                }))
              }
              min={1}
              required
            />
          </FieldContent>
        </Field>
      </div>

      <Field>
        <FieldLabel>콘텐츠 JSON</FieldLabel>
        <FieldContent>
          <Textarea
            value={values.contentJson}
            onChange={(e) =>
              setValues((prev) => ({ ...prev, contentJson: e.target.value }))
            }
            rows={10}
            className="font-mono"
            placeholder="{}"
            required
          />
        </FieldContent>
      </Field>

      {error !== null && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "저장 중..." : isEdit ? "수정 저장" : "스텝 추가"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          취소
        </Button>
        {isEdit && (
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={handleDelete}
            className="ml-auto"
          >
            삭제
          </Button>
        )}
      </div>
    </form>
  )
}
