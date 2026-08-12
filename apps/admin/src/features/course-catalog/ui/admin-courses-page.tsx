"use client"

import { useEffect, useState, useTransition, useRef } from "react"
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
  SearchIcon,
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
import {
  CreateCourseDialog,
  type CreateCourseFormValues,
} from "@/features/course-catalog/ui/create-course-dialog"
import { courseCategoryValues } from "@workspace/contracts/content/category"
import { contentStatuses } from "@workspace/contracts/content/status"
import {
  Alert,
  AlertDescription,
} from "@workspace/ui/components/primitives/alert"
import { Badge } from "@workspace/ui/components/primitives/badge"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@workspace/ui/components/primitives/alert-dialog"
import {
  Button,
  buttonVariants,
} from "@workspace/ui/components/primitives/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@workspace/ui/components/primitives/table"
import { Field, FieldLabel } from "@workspace/ui/components/primitives/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/primitives/select"
import { createAdminCourseImageUrl } from "@/entities/course/model/course-visual-assets"
import {
  createGetFilterHref,
  readGetFormFields,
} from "@/shared/navigation/get-filter-url"
import { cn } from "@workspace/ui/lib/utils"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "#ui/components/primitives/input-group"

const QUERY_SEARCH_DEBOUNCE_MS = 300

const courseStatusFilterItems = [
  { label: "전체 상태", value: "all" },
  { label: "활성", value: contentStatuses.active },
  { label: "보관", value: contentStatuses.archived },
] as const

const courseCategoryFilterItems = [
  { label: "전체 카테고리", value: "all" },
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
  readonly createCourse: (
    input: CreateCourseFormValues
  ) => Promise<AdminRequestResult<AdminCreatedCourse>>
  readonly filters: ReadAdminCoursesInput
  readonly restoreCourse: (
    courseId: string
  ) => Promise<AdminRequestResult<AdminRestoreCourseResult>>
}) {
  const [archiveTarget, setArchiveTarget] = useState<
    AdminCourseList["items"][number] | null
  >(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [message, setMessage] = useState<StatusMessage | null>(null)
  const [queryInput, setQueryInput] = useState(filters.query)
  const [syncedQuery, setSyncedQuery] = useState(filters.query)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()

  if (filters.query !== syncedQuery) {
    setSyncedQuery(filters.query)
    setQueryInput(filters.query)
  }

  useEffect(() => {
    if (queryInput === filters.query) return

    const timeoutId = window.setTimeout(() => {
      if (formRef.current === null) return
      router.push(
        createGetFilterHref(readGetFormFields(formRef.current), {
          query: queryInput,
          page: 1,
        })
      )
    }, QUERY_SEARCH_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [filters.query, queryInput, router])

  if (coursesResult.status === "error") {
    return (
      <>
        <AdminPageHeader
          actions={
            <Button
              disabled={isPending}
              onClick={() => setCreateOpen(true)}
              type="button"
            >
              <PlusIcon aria-hidden="true" size={16} />
              코스 만들기
            </Button>
          }
        />
        <Alert role="alert" variant="destructive">
          <AlertDescription>{coursesResult.error.message}</AlertDescription>
        </Alert>
        <CreateCourseDialog
          key={createOpen ? "create-open" : "create-closed"}
          isPending={isPending}
          onCreate={(values) => {
            startTransition(async () => {
              const result = await createCourse(values)
              setMessage(
                result.status === "ok"
                  ? { message: "새 코스를 만들었습니다.", tone: "success" }
                  : { message: result.error.message, tone: "danger" }
              )
              if (result.status === "ok") setCreateOpen(false)
            })
          }}
          onOpenChange={setCreateOpen}
          open={createOpen}
        />
      </>
    )
  }

  const courses = coursesResult.value
  const { page, pageSize, totalItems, totalPages } = courses.pagination
  const rangeStart = totalItems === 0 ? 0 : (page - 1) * pageSize + 1
  const rangeEnd = Math.min(page * pageSize, totalItems)

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

  const paginationButtonClassName = cn(
    buttonVariants({
      size: "icon-sm",
      variant: "outline",
    }),
    "rounded-xl"
  )

  return (
    <>
      <AdminPageHeader
        actions={
          <Button
            disabled={isPending}
            onClick={() => setCreateOpen(true)}
            type="button"
          >
            <PlusIcon aria-hidden="true" size={16} />
            코스 만들기
          </Button>
        }
      />

      <form
        aria-label="코스 필터"
        ref={formRef}
        method="get"
        className="flex flex-col gap-4 w-full"
      >
        <input name="page" type="hidden" value="1" />
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <div className="relative">
            <Field className="gap-0">
              <FieldLabel className="sr-only">강의명 검색</FieldLabel>

              <InputGroup>
                <InputGroupAddon>
                  <SearchIcon aria-hidden="true" size={16} />
                </InputGroupAddon>
                <InputGroupInput
                  aria-label="강의명 검색"
                  name="query"
                  onChange={(event) => setQueryInput(event.target.value)}
                  placeholder="강의명"
                  type="search"
                  value={queryInput}
                />
              </InputGroup>
            </Field>
          </div>
          <div className="flex gap-3">
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
                  className="w-[11rem] font-semibold"
                  size="sm"
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
                  className="w-[8.5rem] font-semibold"
                  size="sm"
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
          </div>
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

        <div className="overflow-hidden rounded-[1.5rem] border border-border/70 bg-card">
          <Table className="min-w-[720px]">
            <TableCaption className="sr-only">코스 목록</TableCaption>
            <TableHeader>
              <TableRow className="border-b border-border/50 bg-transparent hover:bg-transparent">
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
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={5}
                    className="h-28 p-12 text-center text-muted-foreground font-semibold"
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

        {courses.items.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-muted-foreground font-semibold text-sm">
              <span className="whitespace-nowrap">페이지당 행 수</span>
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

            <div className="flex flex-wrap items-center justify-end gap-3">
              <p className="text-xs tabular-nums text-muted-foreground sm:text-sm">
                전체 {totalItems}개 중 {rangeStart} - {rangeEnd}
              </p>
              <div className="flex items-center gap-1">
                {page > 1 ? (
                  <Link
                    href={createPageLink(1)}
                    aria-label="첫 페이지"
                    className={paginationButtonClassName}
                  >
                    <ChevronsLeftIcon size={16} />
                  </Link>
                ) : (
                  <Button
                    aria-label="첫 페이지"
                    className="rounded-xl"
                    disabled
                    size="icon-sm"
                    type="button"
                    variant="outline"
                  >
                    <ChevronsLeftIcon size={16} />
                  </Button>
                )}
                {page > 1 ? (
                  <Link
                    href={createPageLink(page - 1)}
                    aria-label="이전 페이지"
                    className={paginationButtonClassName}
                  >
                    <ChevronLeftIcon size={16} />
                  </Link>
                ) : (
                  <Button
                    aria-label="이전 페이지"
                    className="rounded-xl"
                    disabled
                    size="icon-sm"
                    type="button"
                    variant="outline"
                  >
                    <ChevronLeftIcon size={16} />
                  </Button>
                )}
                <span className="px-3 font-bold text-foreground text-sm">
                  {page} / {totalPages}
                </span>
                {page < totalPages ? (
                  <Link
                    href={createPageLink(page + 1)}
                    aria-label="다음 페이지"
                    className={paginationButtonClassName}
                  >
                    <ChevronRightIcon size={16} />
                  </Link>
                ) : (
                  <Button
                    aria-label="다음 페이지"
                    className="rounded-xl"
                    disabled
                    size="icon-sm"
                    type="button"
                    variant="outline"
                  >
                    <ChevronRightIcon size={16} />
                  </Button>
                )}
                {page < totalPages ? (
                  <Link
                    href={createPageLink(totalPages)}
                    aria-label="마지막 페이지"
                    className={paginationButtonClassName}
                  >
                    <ChevronsRightIcon size={16} />
                  </Link>
                ) : (
                  <Button
                    aria-label="마지막 페이지"
                    className="rounded-xl"
                    disabled
                    size="icon-sm"
                    type="button"
                    variant="outline"
                  >
                    <ChevronsRightIcon size={16} />
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </form>

      <CreateCourseDialog
        key={createOpen ? "create-open" : "create-closed"}
        isPending={isPending}
        onCreate={(values) => {
          startTransition(async () => {
            const result = await createCourse(values)
            setMessage(
              result.status === "ok"
                ? { message: "새 코스를 만들었습니다.", tone: "success" }
                : { message: result.error.message, tone: "danger" }
            )
            if (result.status === "ok") setCreateOpen(false)
          })
        }}
        onOpenChange={setCreateOpen}
        open={createOpen}
      />

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
