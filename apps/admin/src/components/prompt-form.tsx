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

import { ImageUpload } from "@/components/image-upload"

type PromptType = "sensory" | "reflection" | "opinion"

type PromptFormValues = {
  title: string
  body: string
  promptType: PromptType
  thumbnailUrl: string
}

type Props = {
  defaultValues?: Partial<PromptFormValues>
  promptId?: number
}

const typeOptions: { value: PromptType; label: string }[] = [
  { value: "sensory", label: "감각" },
  { value: "reflection", label: "성찰" },
  { value: "opinion", label: "의견" },
]

export function PromptForm({ defaultValues, promptId }: Props) {
  const router = useRouter()
  const isEdit = promptId !== undefined

  const [values, setValues] = useState<PromptFormValues>({
    title: defaultValues?.title ?? "",
    body: defaultValues?.body ?? "",
    promptType: defaultValues?.promptType ?? "sensory",
    thumbnailUrl: defaultValues?.thumbnailUrl ?? "",
  })
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsPending(true)
    try {
      const url = isEdit ? `/api/prompts/${promptId}` : "/api/prompts"
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
      router.push("/prompts")
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
      const res = await fetch(`/api/prompts/${promptId}`, { method: "DELETE" })
      if (!res.ok) {
        setError("삭제에 실패했습니다")
        return
      }
      router.push("/prompts")
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
        <FieldLabel>본문</FieldLabel>
        <FieldContent>
          <Textarea
            value={values.body}
            onChange={(e) =>
              setValues((prev) => ({ ...prev, body: e.target.value }))
            }
            rows={5}
            required
          />
        </FieldContent>
      </Field>

      <div className="space-y-1.5">
        <label htmlFor="promptType" className="label">
          타입
        </label>
        <select
          id="promptType"
          name="promptType"
          value={values.promptType}
          onChange={(e) =>
            setValues((prev) => ({
              ...prev,
              promptType: e.target.value as PromptType,
            }))
          }
          className="input input--full-width"
        >
          {typeOptions.map((opt) => (
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

      {error !== null && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "저장 중..." : isEdit ? "수정 저장" : "글감 추가"}
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
