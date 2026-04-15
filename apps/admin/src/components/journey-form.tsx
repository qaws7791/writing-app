"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { TextArea } from "@workspace/ui/components/textarea"
import { TextField } from "@workspace/ui/components/text-field"

import { ImageUpload } from "@/components/image-upload"

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

      <div className="space-y-1.5">
        <label htmlFor="category" className="label">
          카테고리
        </label>
        <select
          id="category"
          name="category"
          value={values.category}
          onChange={(e) =>
            setValues((prev) => ({
              ...prev,
              category: e.target.value as JourneyFormValues["category"],
            }))
          }
          className="input input--full-width"
        >
          {categoryOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <ImageUpload
        value={values.thumbnailUrl}
        onUrlChange={(url) =>
          setValues((prev) => ({ ...prev, thumbnailUrl: url ?? "" }))
        }
      />

      {error !== null && <p className="text-destructive text-sm">{error}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" isDisabled={isPending}>
          {isPending ? "저장 중..." : isEdit ? "수정 저장" : "여정 추가"}
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
