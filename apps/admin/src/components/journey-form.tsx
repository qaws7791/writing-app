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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/ui/select"
import { Textarea } from "@workspace/ui/components/ui/textarea"

import { ImageUpload } from "@/components/image-upload"
import {
  finishAdminMutation,
  runAdminMutation,
} from "@/lib/forms/admin-mutation"

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
      const result = await runAdminMutation({
        body: {
          ...values,
          thumbnailUrl: values.thumbnailUrl || null,
        },
        method: isEdit ? "PUT" : "POST",
        url: isEdit ? `/api/journeys/${journeyId}` : "/api/journeys",
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      finishAdminMutation(router, "/journeys")
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
        url: `/api/journeys/${journeyId}`,
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      finishAdminMutation(router, "/journeys")
    } catch {
      setError("서버 오류가 발생했습니다")
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

      <Field>
        <FieldLabel>카테고리</FieldLabel>
        <FieldContent>
          <Select
            items={categoryOptions}
            value={values.category}
            onValueChange={(value) =>
              setValues((prev) => ({
                ...prev,
                category: value as JourneyFormValues["category"],
              }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldContent>
      </Field>

      <ImageUpload
        value={values.thumbnailUrl}
        onUrlChange={(url) =>
          setValues((prev) => ({ ...prev, thumbnailUrl: url ?? "" }))
        }
      />

      {error !== null && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "저장 중..." : isEdit ? "수정 저장" : "여정 추가"}
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
