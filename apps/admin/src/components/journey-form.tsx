"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

type JourneyFormValues = {
  title: string
  description: string
  category: "writing_skill" | "mindfulness" | "practical"
  thumbnailUrl: string
}

type Props = {
  defaultValues?: Partial<JourneyFormValues>
  journeyId?: number
}

const categoryOptions = [
  { value: "writing_skill", label: "글쓰기 스킬" },
  { value: "mindfulness", label: "마음챙김" },
  { value: "practical", label: "실용" },
] as const

export function JourneyForm({ defaultValues, journeyId }: Props) {
  const router = useRouter()
  const isEdit = journeyId !== undefined

  const [values, setValues] = useState<JourneyFormValues>({
    title: defaultValues?.title ?? "",
    description: defaultValues?.description ?? "",
    category: defaultValues?.category ?? "writing_skill",
    thumbnailUrl: defaultValues?.thumbnailUrl ?? "",
  })
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value } = e.target
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsPending(true)
    try {
      const url = isEdit ? `/api/journeys/${journeyId}` : "/api/journeys"
      const method = isEdit ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          thumbnailUrl: values.thumbnailUrl || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(JSON.stringify(data))
        return
      }
      router.push("/journeys")
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
      const res = await fetch(`/api/journeys/${journeyId}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        setError("삭제에 실패했습니다")
        return
      }
      router.push("/journeys")
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
      <div className="space-y-1">
        <label className="block text-sm font-medium">카테고리</label>
        <select
          name="category"
          value={values.category}
          onChange={handleChange}
          className="focus:ring-ring w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:ring-2 focus:outline-none"
        >
          {categoryOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label className="block text-sm font-medium">썸네일 URL (선택)</label>
        <input
          name="thumbnailUrl"
          type="url"
          value={values.thumbnailUrl}
          onChange={handleChange}
          className="focus:ring-ring w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:ring-2 focus:outline-none"
          placeholder="https://..."
        />
      </div>
      {error !== null && <p className="text-destructive text-sm">{error}</p>}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {isPending ? "저장 중..." : isEdit ? "수정 저장" : "여정 추가"}
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
