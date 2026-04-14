"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

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

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value, type } = e.target
    setValues((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }))
  }

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
        <div className="space-y-1">
          <label className="block text-sm font-medium">타입</label>
          <select
            name="type"
            value={values.type}
            onChange={handleChange}
            className="focus:ring-ring w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:ring-2 focus:outline-none"
          >
            {stepTypeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium">순서</label>
          <input
            name="order"
            type="number"
            min={1}
            required
            value={values.order}
            onChange={handleChange}
            className="focus:ring-ring w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:ring-2 focus:outline-none"
          />
        </div>
      </div>
      <div className="space-y-1">
        <label className="block text-sm font-medium">콘텐츠 JSON</label>
        <textarea
          name="contentJson"
          required
          rows={10}
          value={values.contentJson}
          onChange={handleChange}
          className="focus:ring-ring w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm focus:ring-2 focus:outline-none"
          placeholder="{}"
        />
      </div>
      {error !== null && <p className="text-destructive text-sm">{error}</p>}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {isPending ? "저장 중..." : isEdit ? "수정 저장" : "스텝 추가"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-border px-4 py-2 text-sm hover:bg-accent"
        >
          취소
        </button>
        {isEdit && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="border-destructive text-destructive hover:bg-destructive/10 ml-auto rounded-md border px-4 py-2 text-sm disabled:opacity-50"
          >
            삭제
          </button>
        )}
      </div>
    </form>
  )
}
