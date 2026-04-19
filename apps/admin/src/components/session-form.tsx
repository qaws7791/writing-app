"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@workspace/ui/components/ui/button"
import {
  Field,
  FieldContent,
  FieldLabel,
} from "@workspace/ui/components/ui/field"
import { Input } from "@workspace/ui/components/ui/input"
import { Textarea } from "@workspace/ui/components/ui/textarea"

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
      <Field>
        <FieldLabel>제목</FieldLabel>
        <FieldContent>
          <Input
            value={values.title}
            onChange={(e) =>
              setValues((prev) => ({ ...prev, title: e.target.value }))
            }
            required
          />
        </FieldContent>
      </Field>

      <Field>
        <FieldLabel>설명</FieldLabel>
        <FieldContent>
          <Textarea
            value={values.description}
            onChange={(e) =>
              setValues((prev) => ({ ...prev, description: e.target.value }))
            }
            rows={3}
            required
          />
        </FieldContent>
      </Field>

      <div className="grid grid-cols-2 gap-4">
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

        <Field>
          <FieldLabel>예상 소요 시간 (분)</FieldLabel>
          <FieldContent>
            <Input
              type="number"
              value={String(values.estimatedMinutes)}
              onChange={(e) =>
                setValues((prev) => ({
                  ...prev,
                  estimatedMinutes:
                    Number(e.target.value) || prev.estimatedMinutes,
                }))
              }
              min={1}
              required
            />
          </FieldContent>
        </Field>
      </div>

      {error !== null && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "저장 중..." : isEdit ? "수정 저장" : "세션 추가"}
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
