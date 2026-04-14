"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { TextArea } from "@workspace/ui/components/textarea"
import { TextField } from "@workspace/ui/components/text-field"

type StepType =
  | "learn"
  | "read"
  | "guided_question"
  | "write"
  | "feedback"
  | "revise"

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

const stepTypeOptions: { value: StepType; label: string }[] = [
  { value: "learn", label: "학습" },
  { value: "read", label: "읽기" },
  { value: "guided_question", label: "안내 질문" },
  { value: "write", label: "쓰기" },
  { value: "feedback", label: "피드백" },
  { value: "revise", label: "수정" },
]

export function StepForm({
  journeyId,
  sessionId,
  defaultValues,
  stepId,
}: Props) {
  const router = useRouter()
  const isEdit = stepId !== undefined

  const [values, setValues] = useState<StepFormValues>({
    type: defaultValues?.type ?? "learn",
    order: defaultValues?.order ?? 1,
    contentJson: defaultValues?.contentJson
      ? JSON.stringify(defaultValues.contentJson, null, 2)
      : "{}",
  })
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    let contentJson: unknown
    try {
      contentJson = JSON.parse(values.contentJson)
    } catch {
      setError("contentJson이 올바른 JSON 형식이 아닙니다")
      return
    }

    setIsPending(true)
    try {
      const url = isEdit
        ? `/api/journeys/${journeyId}/sessions/${sessionId}/steps/${stepId}`
        : `/api/journeys/${journeyId}/sessions/${sessionId}/steps`
      const method = isEdit ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: values.type,
          order: values.order,
          contentJson,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(JSON.stringify(data))
        return
      }
      router.push(`/journeys/${journeyId}/sessions/${sessionId}`)
      router.refresh()
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
      const res = await fetch(
        `/api/journeys/${journeyId}/sessions/${sessionId}/steps/${stepId}`,
        { method: "DELETE" }
      )
      if (!res.ok) {
        setError("삭제에 실패했습니다")
        return
      }
      router.push(`/journeys/${journeyId}/sessions/${sessionId}`)
      router.refresh()
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

        <TextField
          value={String(values.order)}
          onChange={(v) =>
            setValues((prev) => ({ ...prev, order: Number(v) || prev.order }))
          }
          type="number"
          isRequired
        >
          <Label>순서</Label>
          <Input fullWidth min={1} />
        </TextField>
      </div>

      <TextField
        value={values.contentJson}
        onChange={(v) => setValues((prev) => ({ ...prev, contentJson: v }))}
        isRequired
      >
        <Label>콘텐츠 JSON</Label>
        <TextArea fullWidth rows={10} className="font-mono" placeholder="{}" />
      </TextField>

      {error !== null && <p className="text-destructive text-sm">{error}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" isDisabled={isPending}>
          {isPending ? "저장 중..." : isEdit ? "수정 저장" : "스텝 추가"}
        </Button>
        <Button type="button" variant="outline" onPress={() => router.back()}>
          취소
        </Button>
        {isEdit && (
          <Button
            type="button"
            variant="danger-soft"
            isDisabled={isPending}
            onPress={handleDelete}
            className="ml-auto"
          >
            삭제
          </Button>
        )}
      </div>
    </form>
  )
}
