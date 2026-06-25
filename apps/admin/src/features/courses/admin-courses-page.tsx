"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import Link from "next/link"

import { StatusBadge } from "@/components/status-badge"
import { createAdminCourseImageUrl } from "@/features/courses/course-visual-assets"
import type { AdminApiResult } from "@/lib/api/api-result"
import type {
  AdminArchiveCourseResult,
  AdminCourseDetail,
  AdminCourseList,
  ReadAdminCoursesInput,
} from "@/lib/api/admin-api"
import { contentStatuses } from "@workspace/contracts/status"
import { ArchiveIcon, PlusIcon } from "@workspace/ui/components/icons"
import { Alert, AlertDescription } from "@workspace/ui/components/ui/alert"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@workspace/ui/components/ui/alert-dialog"
import { Button } from "@workspace/ui/components/ui/button"
import {
  DataTable,
  DataTableContainer,
} from "@workspace/ui/components/ui/data-table"
import {
  FilterToolbar,
  FilterToolbarField,
  FilterToolbarLabel,
} from "@workspace/ui/components/ui/filter-toolbar"
import { Input } from "@workspace/ui/components/ui/input"
import { PageHeader } from "@workspace/ui/components/ui/page-header"
import { SectionHeader } from "@workspace/ui/components/ui/section-header"
import { Select } from "@workspace/ui/components/ui/select"
import { Surface } from "@workspace/ui/components/ui/surface"

type StatusMessage = {
  readonly message: string
  readonly tone: "danger" | "success"
}

export function AdminCoursesPage({
  archiveCourse,
  coursesResult,
  createCourse,
  filters,
}: {
  readonly archiveCourse: (
    courseId: string
  ) => Promise<AdminApiResult<AdminArchiveCourseResult>>
  readonly coursesResult: AdminApiResult<AdminCourseList>
  readonly createCourse: () => Promise<AdminApiResult<AdminCourseDetail>>
  readonly filters: ReadAdminCoursesInput
}) {
  const [archiveTarget, setArchiveTarget] = useState<
    AdminCourseList["items"][number] | null
  >(null)
  const [message, setMessage] = useState<StatusMessage | null>(null)
  const [isPending, startTransition] = useTransition()

  if (coursesResult.status === "error") {
    return (
      <>
        <PageHeader
          description="코스를 검색하고 새 강의를 생성하거나 보관합니다."
          title="콘텐츠 관리"
        />
        <Alert role="alert" tone="danger">
          <AlertDescription>{coursesResult.error.message}</AlertDescription>
        </Alert>
      </>
    )
  }

  const courses = coursesResult.value

  return (
    <>
      <PageHeader
        description="코스를 검색하고 새 강의를 생성하거나 보관합니다."
        title="콘텐츠 관리"
      />
      <FilterToolbar method="get" aria-label="코스 필터">
        <FilterToolbarField>
          <FilterToolbarLabel>코스 검색</FilterToolbarLabel>
          <Input
            aria-label="코스 검색"
            defaultValue={filters.query}
            name="query"
            placeholder="제목 또는 설명 검색"
          />
        </FilterToolbarField>
        <FilterToolbarField>
          <FilterToolbarLabel>카테고리</FilterToolbarLabel>
          <Select
            aria-label="카테고리"
            defaultValue={filters.category}
            name="category"
          >
            <option value="">전체</option>
            <option value="입문자를 위한 코스">입문자를 위한 코스</option>
            <option value="문법 심화">문법 심화</option>
            <option value="실전 글쓰기">실전 글쓰기</option>
            <option value="중급 글쓰기">중급 글쓰기</option>
            <option value="심화 글쓰기">심화 글쓰기</option>
            <option value="미분류">미분류</option>
          </Select>
        </FilterToolbarField>
        <FilterToolbarField>
          <FilterToolbarLabel>상태</FilterToolbarLabel>
          <Select aria-label="상태" defaultValue={filters.status} name="status">
            <option value="all">전체</option>
            <option value="active">active</option>
            <option value="archived">archived</option>
          </Select>
        </FilterToolbarField>
        <FilterToolbarField>
          <FilterToolbarLabel>페이지 크기</FilterToolbarLabel>
          <Select
            aria-label="페이지 크기"
            defaultValue={filters.pageSize}
            name="pageSize"
          >
            <option value={10}>10개</option>
            <option value={20}>20개</option>
            <option value={50}>50개</option>
          </Select>
        </FilterToolbarField>
        <Button variant="outline" type="submit">
          필터 적용
        </Button>
        <Button
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              const result = await createCourse()
              setMessage(
                result.status === "ok"
                  ? { message: "새 코스를 만들었습니다.", tone: "success" }
                  : { message: result.error.message, tone: "danger" }
              )
            })
          }}
          type="button"
        >
          <PlusIcon aria-hidden="true" data-icon="inline-start" size={16} />새
          코스
        </Button>
      </FilterToolbar>
      {message === null ? null : (
        <Alert className="mb-4" role="status" tone={message.tone}>
          <AlertDescription>{message.message}</AlertDescription>
        </Alert>
      )}
      <Surface variant="panel">
        <SectionHeader
          title="코스 목록"
          description={`총 ${courses.pagination.totalItems}개 · ${courses.pagination.page}/${courses.pagination.totalPages} 페이지`}
        />
        <DataTableContainer>
          <DataTable>
            <caption className="sr-only">코스 목록</caption>
            <thead>
              <tr>
                <th scope="col">코스</th>
                <th scope="col">카테고리</th>
                <th scope="col">구성</th>
                <th scope="col">상태</th>
                <th scope="col">작업</th>
              </tr>
            </thead>
            <tbody>
              {courses.items.map((course) => (
                <tr key={course.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-[70px] shrink-0 overflow-hidden rounded-card border border-border-subtle bg-bg-canvas">
                        <Image
                          alt=""
                          fill
                          sizes="64px"
                          src={createAdminCourseImageUrl(course.visualKey)}
                        />
                      </div>
                      <div className="grid min-w-0 gap-1">
                        <Link
                          className="font-black text-fg-default hover:underline"
                          href={`/courses/${course.id}`}
                        >
                          {course.title}
                        </Link>
                        <span className="text-caption font-semibold text-fg-muted">
                          revision {course.revision}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>{course.category}</td>
                  <td>
                    {course.unitCount}개 유닛 · {course.lessonCount}개 레슨
                  </td>
                  <td>
                    <StatusBadge status={course.status} />
                  </td>
                  <td>
                    <Button
                      variant="outline"
                      disabled={
                        course.status === contentStatuses.archived || isPending
                      }
                      onClick={() => setArchiveTarget(course)}
                      type="button"
                    >
                      <ArchiveIcon aria-hidden="true" size={15} />
                      보관
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        </DataTableContainer>
      </Surface>
      <AlertDialog
        open={archiveTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setArchiveTarget(null)
          }
        }}
      >
        {archiveTarget === null ? null : (
          <AlertDialogContent>
            <AlertDialogTitle>코스 보관 확인</AlertDialogTitle>
            <AlertDialogDescription>
              {archiveTarget.title} 코스를 학습자 화면에서 숨깁니다.
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <Button
                variant="destructive"
                disabled={isPending}
                onClick={() => {
                  const courseId = archiveTarget.id

                  startTransition(async () => {
                    const result = await archiveCourse(courseId)

                    setMessage(
                      result.status === "ok"
                        ? { message: "코스를 보관했습니다.", tone: "success" }
                        : { message: result.error.message, tone: "danger" }
                    )
                    setArchiveTarget(null)
                  })
                }}
                type="button"
              >
                보관하기
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </>
  )
}
