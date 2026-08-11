"use client"

import { useState, useTransition, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"

import {
  ArchiveIcon,
  PlusIcon,
  LayersIcon,
  BookOpenIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "@workspace/ui/components/icons"
import type { AdminRequestResult } from "@/shared/http/admin-api-client"
import { AdminPageHeader } from "@/shared/ui/admin-page-header"
import type {
  AdminArchiveCourseResult,
  AdminCreatedCourse,
  AdminCourseList,
  AdminRestoreCourseResult,
  ReadAdminCoursesInput,
} from "@/features/course-catalog/model/admin-course-catalog"
import { courseCategoryValues } from "@workspace/contracts/content/category"
import { contentStatuses } from "@workspace/contracts/content/status"
import { Alert, AlertDescription } from "@workspace/ui/components/ui/alert"
import { Badge } from "@workspace/ui/components/ui/badge"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@workspace/ui/components/ui/alert-dialog"
import { Button, buttonVariants } from "@workspace/ui/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@workspace/ui/components/ui/table"
import { Field, FieldLabel } from "@workspace/ui/components/ui/field"
import { Input } from "@workspace/ui/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/ui/select"
import { createAdminCourseImageUrl } from "@/entities/course/model/course-visual-assets"
import {
  createGetFilterHref,
  readGetFormFields,
} from "@/shared/navigation/get-filter-url"

const courseStatusFilterItems = [
  { label: "전체 상태", value: "all" },
  { label: "활성", value: contentStatuses.active },
  { label: "보관", value: contentStatuses.archived },
] as const

const courseCategoryFilterItems = [
  { label: "전체 카테고리", value: "" },
  ...courseCategoryValues.map((category) => ({
    label: category,
    value: category,
  })),
]

const coursePageSizeItems = [
  { label: "10개", value: "10" },
  { label: "20개", value: "20" },
  { label: "50개", value: "50" },
] as const

type StatusMessage = {
  readonly message: string
  readonly tone: "danger" | "success"
}

export function AdminCoursesPage({
  archiveCourse,
  coursesResult,
  createCourse,
  filters,
  restoreCourse,
}: {
  readonly archiveCourse: (
    courseId: string
  ) => Promise<AdminRequestResult<AdminArchiveCourseResult>>
  readonly coursesResult: AdminRequestResult<AdminCourseList>
  readonly createCourse: () => Promise<AdminRequestResult<AdminCreatedCourse>>
  readonly filters: ReadAdminCoursesInput
  readonly restoreCourse: (
    courseId: string
  ) => Promise<AdminRequestResult<AdminRestoreCourseResult>>
}) {
  const [archiveTarget, setArchiveTarget] = useState<
    AdminCourseList["items"][number] | null
  >(null)
  const [message, setMessage] = useState<StatusMessage | null>(null)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()

  if (coursesResult.status === "error") {
    return (
      <>
        <AdminPageHeader description="코스를 확인하고 새 강의를 생성하거나 보관합니다." />
        <Alert role="alert" variant="destructive">
          <AlertDescription>{coursesResult.error.message}</AlertDescription>
        </Alert>
      </>
    )
  }

  const courses = coursesResult.value

  const createPageLink = (pageNumber: number) => {
    return createGetFilterHref(
      [
        ["query", filters.query],
        ["category", filters.category],
        ["status", filters.status],
        ["pageSize", filters.pageSize],
      ],
      { page: pageNumber }
    )
  }

  const submitSelectValue = (name: string, value: string | null) => {
    if (formRef.current === null || value === null) return
    router.push(
      createGetFilterHref(readGetFormFields(formRef.current), {
        [name]: value,
        page: 1,
      })
    )
  }

  return (
    <>
      <AdminPageHeader
        description={`강의 ${courses.pagination.totalItems}개 · 편집 내용은 학습자 앱에 즉시 반영됩니다.`}
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
            >
              <PlusIcon aria-hidden="true" size={16} />새 강의
            </Button>
          </div>
        }
      />

      <form
        aria-label="코스 필터"
        ref={formRef}
        method="get"
        className="flex flex-col gap-4 w-full"
      >
        <input name="page" type="hidden" value="1" />
        <div className="flex flex-wrap items-center gap-3 w-full">
          <Field className="gap-0">
            <FieldLabel className="sr-only">강의명 검색</FieldLabel>
            <Input
              aria-label="강의명 검색"
              className="w-56"
              defaultValue={filters.query}
              name="query"
              placeholder="강의명"
              type="search"
            />
          </Field>
          <Button type="submit" variant="outline">
            검색
          </Button>
          <Field className="gap-0">
            <FieldLabel className="sr-only">카테고리</FieldLabel>
            <Select
              value={filters.category}
              items={courseCategoryFilterItems}
              name="category"
              onValueChange={(value) => {
                submitSelectValue("category", value)
              }}
            >
              <SelectTrigger
                aria-label="카테고리"
                className="w-[180px] font-semibold"
              >
                <SelectValue placeholder="전체 카테고리" />
              </SelectTrigger>
              <SelectContent>
                {courseCategoryFilterItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field className="gap-0">
            <FieldLabel className="sr-only">상태</FieldLabel>
            <Select
              value={filters.status}
              items={courseStatusFilterItems}
              name="status"
              onValueChange={(value) => {
                submitSelectValue("status", value)
              }}
            >
              <SelectTrigger
                aria-label="상태"
                className="w-[140px] font-semibold"
              >
                <SelectValue placeholder="전체 상태" />
              </SelectTrigger>
              <SelectContent>
                {courseStatusFilterItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <span className="text-muted-foreground font-bold ml-auto text-sm">
            {courses.pagination.totalItems}개 결과
          </span>
        </div>

        {message === null ? null : (
          <Alert
            className="mb-2"
            role="status"
            variant={message.tone === "danger" ? "destructive" : "default"}
          >
            <AlertDescription>{message.message}</AlertDescription>
          </Alert>
        )}

        {/* 테이블 박스: 배경 없음, 테두리, 둥근 모서리 */}
        <div className="border border-border/50 rounded-[24px] overflow-hidden">
          <Table className="min-w-[720px]">
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
                <TableHead scope="col" className="px-4 py-3.5 w-[60px]">
                  <span className="sr-only">작업</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="p-12 text-center text-muted-foreground font-semibold"
                  >
                    선택한 조건에 맞는 코스가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                courses.items.map((course) => (
                  <TableRow
                    key={course.id}
                    className="group border-b border-border/50 transition-colors last:border-b-0 hover:bg-muted/45"
                  >
                    <TableCell className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl border border-border/50 bg-background">
                          <Image
                            alt={course.cover?.altText ?? ""}
                            fill
                            sizes="36px"
                            src={
                              course.cover?.url ??
                              createAdminCourseImageUrl(course.visualKey)
                            }
                            className="object-cover"
                            unoptimized={course.cover !== null}
                          />
                        </div>
                        <div className="grid min-w-0">
                          <Link
                            className="font-bold text-foreground hover:underline text-sm"
                            href={`/courses/${course.id}`}
                            prefetch={false}
                          >
                            {course.title}
                          </Link>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-center">
                      {course.category && (
                        <Badge variant="outline">{course.category}</Badge>
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
                      {course.status === contentStatuses.archived ? (
                        <Button
                          aria-label={`${course.title} 보관 해제`}
                          className="rounded-xl font-bold"
                          disabled={isPending}
                          onClick={() => {
                            const courseId = course.id

                            startTransition(async () => {
                              const result = await restoreCourse(courseId)

                              setMessage(
                                result.status === "ok"
                                  ? {
                                      message: "코스 보관을 해제했습니다.",
                                      tone: "success",
                                    }
                                  : {
                                      message: result.error.message,
                                      tone: "danger",
                                    }
                              )
                            })
                          }}
                          size="sm"
                          type="button"
                          variant="ghost"
                        >
                          보관 해제
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isPending}
                          onClick={() => setArchiveTarget(course)}
                          type="button"
                          className="h-8 w-8 rounded-xl text-destructive hover:bg-destructive/10"
                          aria-label={`${course.title} 보관`}
                        >
                          <ArchiveIcon aria-hidden="true" size={15} />
                        </Button>
                      )}
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
              <Field className="gap-0">
                <FieldLabel className="sr-only">페이지 크기</FieldLabel>
                <Select
                  value={String(filters.pageSize)}
                  items={coursePageSizeItems}
                  name="pageSize"
                  onValueChange={(value) => {
                    submitSelectValue("pageSize", value)
                  }}
                >
                  <SelectTrigger
                    aria-label="페이지 크기"
                    className="font-semibold"
                    size="sm"
                  >
                    <SelectValue placeholder="20개" />
                  </SelectTrigger>
                  <SelectContent>
                    {coursePageSizeItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            {/* 4개 이동 버튼 페이지네이션 */}
            <div className="flex items-center gap-1">
              {courses.pagination.page > 1 ? (
                <Link
                  href={createPageLink(1)}
                  aria-label="첫 페이지"
                  className={buttonVariants({
                    size: "icon-xs",
                    variant: "ghost",
                  })}
                >
                  <ChevronsLeftIcon size={16} />
                </Link>
              ) : (
                <Button
                  aria-label="첫 페이지"
                  disabled
                  size="icon-xs"
                  type="button"
                  variant="ghost"
                >
                  <ChevronsLeftIcon size={16} />
                </Button>
              )}
              {courses.pagination.page > 1 ? (
                <Link
                  href={createPageLink(courses.pagination.page - 1)}
                  aria-label="이전 페이지"
                  className={buttonVariants({
                    size: "icon-xs",
                    variant: "ghost",
                  })}
                >
                  <ChevronLeftIcon size={16} />
                </Link>
              ) : (
                <Button
                  aria-label="이전 페이지"
                  disabled
                  size="icon-xs"
                  type="button"
                  variant="ghost"
                >
                  <ChevronLeftIcon size={16} />
                </Button>
              )}
              <span className="px-3 font-bold text-foreground text-sm">
                {courses.pagination.page} / {courses.pagination.totalPages}
              </span>
              {courses.pagination.page < courses.pagination.totalPages ? (
                <Link
                  href={createPageLink(courses.pagination.page + 1)}
                  aria-label="다음 페이지"
                  className={buttonVariants({
                    size: "icon-xs",
                    variant: "ghost",
                  })}
                >
                  <ChevronRightIcon size={16} />
                </Link>
              ) : (
                <Button
                  aria-label="다음 페이지"
                  disabled
                  size="icon-xs"
                  type="button"
                  variant="ghost"
                >
                  <ChevronRightIcon size={16} />
                </Button>
              )}
              {courses.pagination.page < courses.pagination.totalPages ? (
                <Link
                  href={createPageLink(courses.pagination.totalPages)}
                  aria-label="마지막 페이지"
                  className={buttonVariants({
                    size: "icon-xs",
                    variant: "ghost",
                  })}
                >
                  <ChevronsRightIcon size={16} />
                </Link>
              ) : (
                <Button
                  aria-label="마지막 페이지"
                  disabled
                  size="icon-xs"
                  type="button"
                  variant="ghost"
                >
                  <ChevronsRightIcon size={16} />
                </Button>
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
                size="lg"
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
