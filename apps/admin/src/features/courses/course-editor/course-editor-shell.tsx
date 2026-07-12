"use client"

import Link from "next/link"
import { useMemo, useState } from "react"

import type { AdminCourseDetail } from "@/features/courses/admin-courses-api"
import {
  ChevronDownIcon,
  ChevronRightIcon,
  PlusIcon,
  TrashIcon,
} from "@workspace/ui/components/icons"
import { Field, FieldLabel } from "@workspace/ui/components/ui/field"
import { Input } from "@workspace/ui/components/ui/input"
import { Textarea } from "@workspace/ui/components/ui/textarea"
import { cn } from "@workspace/ui/lib/utils"

type EditorTab = "curriculum" | "info"

export function CourseEditorShell({
  course,
}: {
  readonly course: AdminCourseDetail
}) {
  const [tab, setTab] = useState<EditorTab>("info")
  const lessonCount = useMemo(
    () => course.units.reduce((count, unit) => count + unit.lessons.length, 0),
    [course.units]
  )

  return (
    <div className="-mx-5 -mt-8 flex min-h-full flex-col md:-mx-10">
      <div className="border-b border-surface-hover px-6 pb-0 pt-8 md:px-10">
        <nav
          aria-label="코스 편집 경로"
          className="mb-4 flex items-center gap-1.5 text-[0.8125rem]"
        >
          <Link
            className="font-medium text-muted-foreground transition-colors hover:text-foreground"
            href="/courses"
          >
            콘텐츠 관리
          </Link>
          <ChevronRightIcon
            aria-hidden="true"
            className="text-muted-foreground"
            size={13}
          />
          <span className="font-medium text-foreground">
            {course.title || "제목 없음"}
          </span>
        </nav>
        <h1 className="mb-5 text-[1.375rem] font-bold text-foreground">
          {course.title || "제목 없음"}
        </h1>
        <div className="-mb-px flex gap-0">
          <TabButton
            active={tab === "info"}
            label="강의 정보"
            onClick={() => setTab("info")}
          />
          <TabButton
            active={tab === "curriculum"}
            label="커리큘럼"
            onClick={() => setTab("curriculum")}
          />
        </div>
      </div>
      <div className="flex-1 px-6 py-8 md:px-10">
        {tab === "info" ? (
          <fieldset className="m-0 max-w-xl border-0 p-0" disabled>
            <legend className="sr-only">강의 정보 미리보기</legend>
            <Field>
              <FieldLabel htmlFor="course-editor-title">제목</FieldLabel>
              <Input
                defaultValue={course.title}
                id="course-editor-title"
                readOnly
              />
            </Field>
            <Field className="mt-4">
              <FieldLabel htmlFor="course-editor-description">설명</FieldLabel>
              <Textarea
                defaultValue={course.description}
                id="course-editor-description"
                readOnly
              />
            </Field>
            <Field className="mt-4">
              <FieldLabel htmlFor="course-editor-category">카테고리</FieldLabel>
              <Input
                defaultValue={course.category}
                id="course-editor-category"
                readOnly
              />
            </Field>
          </fieldset>
        ) : (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <p className="m-0 text-[0.875rem] font-medium text-muted-foreground">
                유닛 {course.units.length}개 · 레슨 {lessonCount}개
              </p>
              <button
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-[0.875rem] font-bold text-primary-foreground opacity-60"
                disabled
                type="button"
              >
                <PlusIcon aria-hidden="true" size={15} />
                유닛 추가
              </button>
            </div>
            {course.units.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-surface-hover py-16 text-center">
                <p className="m-0 text-[0.9375rem] font-medium text-muted-foreground">
                  유닛을 추가해 시작하세요.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {course.units.map((unit, unitIndex) => (
                  <div key={unit.id}>
                    <div className="mb-2 flex items-center gap-3">
                      <span className="text-[0.75rem] font-bold text-muted-foreground">
                        UNIT {unitIndex + 1}
                      </span>
                      <div className="h-px flex-1 bg-surface-hover" />
                      <button
                        className="p-1 text-muted-foreground opacity-40"
                        disabled
                        type="button"
                      >
                        <TrashIcon aria-hidden="true" size={15} />
                      </button>
                    </div>
                    <input
                      className="mb-3 w-full border-b-2 border-transparent bg-transparent py-1 text-[1.0625rem] font-bold text-foreground outline-none"
                      defaultValue={unit.title}
                      readOnly
                    />
                    <div className="flex flex-col">
                      {unit.lessons.map((lesson, lessonIndex) => (
                        <div
                          className="group flex items-center gap-3 border-b border-surface-hover py-3"
                          key={lesson.id}
                        >
                          <div className="flex shrink-0 flex-col gap-0.5">
                            <button
                              className="p-0.5 text-muted-foreground opacity-30"
                              disabled
                              type="button"
                            >
                              <ChevronDownIcon aria-hidden="true" size={13} />
                            </button>
                          </div>
                          <span className="w-5 shrink-0 text-right text-[0.8125rem] font-bold text-muted-foreground">
                            {lessonIndex + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[0.9375rem] font-bold text-foreground">
                              {lesson.title}
                            </div>
                            <div className="text-[0.75rem] font-medium text-muted-foreground">
                              스텝 {lesson.steps.length}개
                            </div>
                          </div>
                          <div className="flex items-center gap-2 opacity-70 transition-opacity group-hover:opacity-100">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-[0.8125rem] font-bold text-foreground">
                              편집
                            </span>
                          </div>
                        </div>
                      ))}
                      <button
                        className="flex items-center gap-1.5 self-start py-3 text-[0.875rem] font-bold text-muted-foreground opacity-50"
                        disabled
                        type="button"
                      >
                        <PlusIcon aria-hidden="true" size={15} />
                        레슨 추가
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function TabButton({
  active,
  label,
  onClick,
}: {
  readonly active: boolean
  readonly label: string
  readonly onClick: () => void
}) {
  return (
    <button
      className={cn(
        "border-b-2 px-5 py-3 text-[0.9375rem] font-bold transition-colors",
        active
          ? "border-foreground text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
      )}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  )
}
