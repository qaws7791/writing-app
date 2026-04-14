"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { TextArea } from "@workspace/ui/components/textarea"
import { TextField } from "@workspace/ui/components/text-field"

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
        { method: "DELETE" }
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
      <TextField
        value={values.title}
        onChange={(v) => setValues((prev) => ({ ...prev, title: v }))}
        isRequired
      >
        <Label>제목</Label>
        <Input fullWidth />
      </TextField>

      <TextField
        value={values.description}
        onChange={(v) => setValues((prev) => ({ ...prev, description: v }))}
        isRequired
      >
        <Label>설명</Label>
        <TextArea fullWidth rows={3} />
      </TextField>

      <div className="grid grid-cols-2 gap-4">
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

        <TextField
          value={String(values.estimatedMinutes)}
          onChange={(v) =>
            setValues((prev) => ({
              ...prev,
              estimatedMinutes: Number(v) || prev.estimatedMinutes,
            }))
          }
          type="number"
          isRequired
        >
          <Label>예상 소요 시간 (분)</Label>
          <Input fullWidth min={1} />
        </TextField>
      </div>

      {error !== null && <p className="text-destructive text-sm">{error}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" isDisabled={isPending}>
          {isPending ? "저장 중..." : isEdit ? "수정 저장" : "세션 추가"}
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
