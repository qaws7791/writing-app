"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

type SessionFormValues = {
  title: string
  description: string
  estimatedMinutes: number
  order: number
}

type Props = {
  journeyId: number
  defaultValues?: Partial<SessionFormValues>
  sessionId?: number
}

export function SessionForm({ journeyId, defaultValues, sessionId }: Props) {
  const router = useRouter()
  const isEdit = sessionId !== undefined

  const [values, setValues] = useState<SessionFormValues>({
    title: defaultValues?.title ?? "",
    description: defaultValues?.description ?? "",
    estimatedMinutes: defaultValues?.estimatedMinutes ?? 10,
    order: defaultValues?.order ?? 1,
  })
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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
    setIsPending(true)
    try {
      const url = isEdit
        ? `/api/journeys/${journeyId}/sessions/${sessionId}`
        : `/api/journeys/${journeyId}/sessions`
      const method = isEdit ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(JSON.stringify(data))
        return
      }
      router.push(`/journeys/${journeyId}`)
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
        `/api/journeys/${journeyId}/sessions/${sessionId}`,
        {
          method: "DELETE",
        }
      )
      if (!res.ok) {
        setError("삭제에 실패했습니다")
        return
      }
      router.push(`/journeys/${journeyId}`)
      router.refresh()
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1">
        <label className="block text-sm font-medium">제목</label>
        <input
          name="title"
          required
          value={values.title}
          onChange={handleChange}
          className="focus:ring-ring w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:ring-2 focus:outline-none"
        />
      </div>
      <div className="space-y-1">
        <label className="block text-sm font-medium">설명</label>
        <textarea
          name="description"
          required
          rows={3}
          value={values.description}
          onChange={handleChange}
          className="focus:ring-ring w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:ring-2 focus:outline-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
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
        <div className="space-y-1">
          <label className="block text-sm font-medium">
            예상 소요 시간 (분)
          </label>
          <input
            name="estimatedMinutes"
            type="number"
            min={1}
            required
            value={values.estimatedMinutes}
            onChange={handleChange}
            className="focus:ring-ring w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:ring-2 focus:outline-none"
          />
        </div>
      </div>
      {error !== null && <p className="text-destructive text-sm">{error}</p>}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {isPending ? "저장 중..." : isEdit ? "수정 저장" : "세션 추가"}
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
