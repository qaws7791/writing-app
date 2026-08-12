"use client"

import { useRef, useState, type FormEvent } from "react"

import {
  uncategorizedCourseCategory,
  courseCategoryValues,
  type CourseCategory,
} from "@workspace/contracts/content/category"
import { Button } from "@workspace/ui/components/primitives/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/primitives/dialog"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/primitives/field"
import { Input } from "@workspace/ui/components/primitives/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/primitives/select"
import { Textarea } from "@workspace/ui/components/primitives/textarea"

export type CreateCourseFormValues = {
  readonly category: CourseCategory
  readonly description: string
  readonly title: string
}

const courseCategoryItems = courseCategoryValues.map((category) => ({
  label: category,
  value: category,
}))

const EMPTY_CREATE_VALUES: CreateCourseFormValues = {
  category: uncategorizedCourseCategory,
  description: "",
  title: "",
}

export function CreateCourseDialog({
  isPending,
  onCreate,
  onOpenChange,
  open,
}: {
  readonly isPending: boolean
  readonly onCreate: (values: CreateCourseFormValues) => void
  readonly onOpenChange: (open: boolean) => void
  readonly open: boolean
}) {
  const [values, setValues] =
    useState<CreateCourseFormValues>(EMPTY_CREATE_VALUES)
  const [titleError, setTitleError] = useState<string | null>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const titleInvalid = Boolean(titleError)

  function updateField<K extends keyof CreateCourseFormValues>(
    key: K,
    value: CreateCourseFormValues[K]
  ) {
    setValues((prev) => ({ ...prev, [key]: value }))
    if (key === "title" && titleError) setTitleError(null)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const title = values.title.trim()
    if (!title) {
      setTitleError("코스 제목을 입력해 주세요.")
      return
    }
    onCreate({
      category: values.category,
      description: values.description.trim(),
      title,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg"
        showCloseButton
        initialFocus={titleInputRef}
      >
        <DialogHeader className="pe-8">
          <DialogTitle>코스 만들기</DialogTitle>
          <DialogDescription>
            목록에서 구분할 기본 정보만 넣습니다. 유닛·레슨·표지는 만든 뒤
            편집에서 이어갑니다.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <FieldGroup className="gap-5">
            <Field data-invalid={titleInvalid || undefined}>
              <FieldLabel htmlFor="create-course-title">제목</FieldLabel>
              <Input
                ref={titleInputRef}
                id="create-course-title"
                value={values.title}
                onChange={(event) => updateField("title", event.target.value)}
                placeholder="예: 문장 쓰기 기초"
                aria-invalid={titleInvalid || undefined}
                disabled={isPending}
              />
              {titleError ? <FieldError>{titleError}</FieldError> : null}
            </Field>

            <Field>
              <FieldLabel htmlFor="create-course-category">카테고리</FieldLabel>
              <Select
                items={courseCategoryItems}
                value={values.category}
                onValueChange={(value) => {
                  if (value === null) return
                  updateField("category", value as CourseCategory)
                }}
                disabled={isPending}
              >
                <SelectTrigger id="create-course-category" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start">
                  {courseCategoryItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="create-course-description">설명</FieldLabel>
              <Textarea
                id="create-course-description"
                value={values.description}
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
                placeholder="학습자에게 보일 소개 (선택)"
                className="min-h-20"
                disabled={isPending}
              />
              <FieldDescription>
                비워 두어도 됩니다. 편집 화면에서 다듬을 수 있습니다.
              </FieldDescription>
            </Field>
          </FieldGroup>

          <DialogFooter>
            <DialogClose
              render={
                <Button type="button" variant="outline" disabled={isPending} />
              }
            >
              취소
            </DialogClose>
            <Button disabled={isPending} type="submit">
              만들기
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
