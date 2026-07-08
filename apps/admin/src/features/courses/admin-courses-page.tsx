"use client"

import { useState, useTransition, useRef } from "react"
import Image from "next/image"
import Link from "next/link"

import {
  ArchiveIcon,
  PlusIcon,
  SearchIcon,
  LayersIcon,
  BookOpenIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "@workspace/ui/components/icons"
import type { AdminApiResult } from "@/lib/api/api-result"
import type {
  AdminArchiveCourseResult,
  AdminCourseDetail,
  AdminCourseList,
  ReadAdminCoursesInput,
} from "@/lib/api/admin-api"
import { contentStatuses } from "@workspace/contracts/status"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@workspace/ui/components/ui/table"
import {
  FilterToolbarField,
  FilterToolbarLabel,
} from "@workspace/ui/components/ui/filter-toolbar"
import { Input } from "@workspace/ui/components/ui/input"
import { PageHeader } from "@workspace/ui/components/ui/page-header"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/ui/select"
import { createAdminCourseImageUrl } from "@/features/courses/course-visual-assets"

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
  const formRef = useRef<HTMLFormElement>(null)

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

  const createPageLink = (pageNumber: number) => {
    const params = new URLSearchParams()
    if (filters.query) params.set("query", filters.query)
    if (filters.category) params.set("category", filters.category)
    if (filters.status && filters.status !== "all") {
      params.set("status", filters.status)
    }
    if (filters.pageSize) params.set("pageSize", String(filters.pageSize))
    params.set("page", String(pageNumber))
    return `?${params.toString()}`
  }

  return (
    <>
      <PageHeader
        description={`강의 ${courses.pagination.totalItems}개 · 편집 내용은 학습자 앱에 즉시 반영됩니다.`}
        title="콘텐츠 관리"
        actions={
          <div className="flex flex-col items-end gap-2">
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
              className="rounded-full bg-fg-default text-bg-canvas hover:bg-fg-default/90 px-5 py-3 font-bold flex items-center gap-2 text-sm"
            >
              <PlusIcon aria-hidden="true" size={16} />새 강의
            </Button>
            <Link
              className="text-xs font-bold text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              href="/debug/steps"
            >
              스텝 디버그 →
            </Link>
          </div>
        }
      />

      <form ref={formRef} method="get" className="flex flex-col gap-4 w-full">
        {/* 검색 및 필터링 바 */}
        <div className="flex flex-wrap items-center gap-3 w-full">
          <FilterToolbarField className="relative flex-1 min-w-[240px] gap-0">
            <FilterToolbarLabel className="sr-only">
              코스 검색
            </FilterToolbarLabel>
            <SearchIcon
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              size={16}
            />
            <Input
              aria-label="코스 검색"
              defaultValue={filters.query}
              name="query"
              placeholder="강의 제목 또는 설명 검색..."
              className="pl-10 font-semibold"
            />
          </FilterToolbarField>
          <FilterToolbarField className="gap-0">
            <FilterToolbarLabel className="sr-only">
              카테고리
            </FilterToolbarLabel>
            <Select
              aria-label="카테고리"
              defaultValue={filters.category}
              name="category"
              onValueChange={() => {
                formRef.current?.requestSubmit()
              }}
            >
              <SelectTrigger
                className="w-[180px] font-semibold"
                variant="outlined"
              >
                <SelectValue placeholder="전체 카테고리" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">전체 카테고리</SelectItem>
                <SelectItem value="입문자를 위한 코스">
                  입문자를 위한 코스
                </SelectItem>
                <SelectItem value="문법 심화">문법 심화</SelectItem>
                <SelectItem value="실전 글쓰기">실전 글쓰기</SelectItem>
                <SelectItem value="중급 글쓰기">중급 글쓰기</SelectItem>
                <SelectItem value="심화 글쓰기">심화 글쓰기</SelectItem>
                <SelectItem value="미분류">미분류</SelectItem>
              </SelectContent>
            </Select>
          </FilterToolbarField>
          <FilterToolbarField className="gap-0">
            <FilterToolbarLabel className="sr-only">상태</FilterToolbarLabel>
            <Select
              aria-label="상태"
              defaultValue={filters.status}
              name="status"
              onValueChange={() => {
                formRef.current?.requestSubmit()
              }}
            >
              <SelectTrigger
                className="w-[140px] font-semibold"
                variant="outlined"
              >
                <SelectValue placeholder="전체 상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 상태</SelectItem>
                <SelectItem value="active">active</SelectItem>
                <SelectItem value="archived">archived</SelectItem>
              </SelectContent>
            </Select>
          </FilterToolbarField>
          <span className="text-muted-foreground font-bold ml-auto text-sm">
            {courses.pagination.totalItems}개 결과
          </span>
        </div>

        {message === null ? null : (
          <Alert className="mb-2" role="status" tone={message.tone}>
            <AlertDescription>{message.message}</AlertDescription>
          </Alert>
        )}

        {/* 테이블 박스: 배경 없음, 테두리, 둥근 모서리 */}
        <div className="border border-border/50 rounded-[24px] overflow-hidden">
          <Table className="min-w-0">
            <TableCaption className="sr-only">코스 목록</TableCaption>
            <TableHeader>
              <TableRow className="border-b border-border/50 bg-transparent">
                <TableHead
                  scope="col"
                  className="px-5 py-3.5 text-muted-foreground font-bold text-[0.8125rem] w-[50%]"
                >
                  강의명
                </TableHead>
                <TableHead
                  scope="col"
                  className="px-4 py-3.5 text-muted-foreground font-bold text-[0.8125rem] text-center w-[20%]"
                >
                  카테고리
                </TableHead>
                <TableHead
                  scope="col"
                  className="px-4 py-3.5 text-muted-foreground font-bold text-[0.8125rem] text-center w-[15%]"
                >
                  유닛
                </TableHead>
                <TableHead
                  scope="col"
                  className="px-4 py-3.5 text-muted-foreground font-bold text-[0.8125rem] text-center w-[15%]"
                >
                  레슨
                </TableHead>
                <TableHead scope="col" className="px-4 py-3.5 w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="p-12 text-center text-muted-foreground font-semibold"
                  >
                    검색 결과가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                courses.items.map((course) => (
                  <TableRow
                    key={course.id}
                    className="group transition-colors hover:bg-fg-default/5 border-b border-border/50 last:border-b-0"
                  >
                    <TableCell className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl border border-border/50 bg-background">
                          <Image
                            alt=""
                            fill
                            sizes="36px"
                            src={createAdminCourseImageUrl(course.visualKey)}
                            className="object-cover"
                          />
                        </div>
                        <div className="grid min-w-0">
                          <Link
                            className="font-bold text-foreground hover:underline text-sm"
                            href={`/courses/${course.id}`}
                          >
                            {course.title}
                          </Link>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-center">
                      {course.category && (
                        <span className="inline-block border border-border/50 rounded-full px-3 py-0.5 font-bold text-[0.75rem] text-foreground bg-transparent">
                          {course.category}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-4 text-center">
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground font-bold text-[0.875rem]">
                        <LayersIcon
                          size={13}
                          className="text-muted-foreground"
                        />{" "}
                        {course.unitCount}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-center">
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground font-bold text-[0.875rem]">
                        <BookOpenIcon
                          size={13}
                          className="text-muted-foreground"
                        />{" "}
                        {course.lessonCount}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={
                          course.status === contentStatuses.archived ||
                          isPending
                        }
                        onClick={() => setArchiveTarget(course)}
                        type="button"
                        className="h-8 w-8 rounded-xl text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="보관"
                      >
                        <ArchiveIcon aria-hidden="true" size={15} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* 테이블 하단 페이징 영역 */}
        {courses.items.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
            {/* 페이지 크기 선택 */}
            <div className="flex items-center gap-2 text-muted-foreground font-semibold text-sm">
              <span>페이지당</span>
              <FilterToolbarField className="gap-0">
                <FilterToolbarLabel className="sr-only">
                  페이지 크기
                </FilterToolbarLabel>
                <Select
                  aria-label="페이지 크기"
                  defaultValue={filters.pageSize}
                  name="pageSize"
                  onValueChange={() => {
                    formRef.current?.requestSubmit()
                  }}
                >
                  <SelectTrigger
                    className="h-8 w-[80px] font-semibold"
                    variant="outlined"
                  >
                    <SelectValue placeholder="20개" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10개</SelectItem>
                    <SelectItem value="20">20개</SelectItem>
                    <SelectItem value="50">50개</SelectItem>
                  </SelectContent>
                </Select>
              </FilterToolbarField>
            </div>

            {/* 4개 이동 버튼 페이지네이션 */}
            <div className="flex items-center gap-1">
              {courses.pagination.page > 1 ? (
                <Link
                  href={createPageLink(1)}
                  aria-label="첫 페이지"
                  className="h-8 w-8 p-1.5 rounded-xl text-muted-foreground border border-transparent hover:border-border/50 hover:bg-fg-default/5 transition-colors flex items-center justify-center"
                >
                  <ChevronsLeftIcon size={16} />
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="h-8 w-8 p-1.5 rounded-xl text-muted-foreground/30 border border-transparent flex items-center justify-center cursor-not-allowed"
                >
                  <ChevronsLeftIcon size={16} />
                </button>
              )}
              {courses.pagination.page > 1 ? (
                <Link
                  href={createPageLink(courses.pagination.page - 1)}
                  aria-label="이전 페이지"
                  className="h-8 w-8 p-1.5 rounded-xl text-muted-foreground border border-transparent hover:border-border/50 hover:bg-fg-default/5 transition-colors flex items-center justify-center"
                >
                  <ChevronLeftIcon size={16} />
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="h-8 w-8 p-1.5 rounded-xl text-muted-foreground/30 border border-transparent flex items-center justify-center cursor-not-allowed"
                >
                  <ChevronLeftIcon size={16} />
                </button>
              )}
              <span className="px-3 font-bold text-foreground text-sm">
                {courses.pagination.page} / {courses.pagination.totalPages}
              </span>
              {courses.pagination.page < courses.pagination.totalPages ? (
                <Link
                  href={createPageLink(courses.pagination.page + 1)}
                  aria-label="다음 페이지"
                  className="h-8 w-8 p-1.5 rounded-xl text-muted-foreground border border-transparent hover:border-border/50 hover:bg-fg-default/5 transition-colors flex items-center justify-center"
                >
                  <ChevronRightIcon size={16} />
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="h-8 w-8 p-1.5 rounded-xl text-muted-foreground/30 border border-transparent flex items-center justify-center cursor-not-allowed"
                >
                  <ChevronRightIcon size={16} />
                </button>
              )}
              {courses.pagination.page < courses.pagination.totalPages ? (
                <Link
                  href={createPageLink(courses.pagination.totalPages)}
                  aria-label="마지막 페이지"
                  className="h-8 w-8 p-1.5 rounded-xl text-muted-foreground border border-transparent hover:border-border/50 hover:bg-fg-default/5 transition-colors flex items-center justify-center"
                >
                  <ChevronsRightIcon size={16} />
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="h-8 w-8 p-1.5 rounded-xl text-muted-foreground/30 border border-transparent flex items-center justify-center cursor-not-allowed"
                >
                  <ChevronsRightIcon size={16} />
                </button>
              )}
            </div>
          </div>
        )}
      </form>

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
                size="extra"
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
