"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  ArrowLeftDoubleIcon,
  ArrowRight01Icon,
  ArrowRightDoubleIcon,
  MoreHorizontalIcon,
  PlusSignIcon,
  Search01Icon,
} from "@hugeicons/core-free-icons"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table"

import { cn } from "#ui/lib/utils"
import { AdminShell } from "#ui/blocks/admin-shell"
import { Badge } from "#ui/components/ui/badge"
import { Button } from "#ui/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#ui/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#ui/components/ui/dropdown-menu"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "#ui/components/ui/field"
import { Input } from "#ui/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#ui/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "#ui/components/ui/table"
import { Textarea } from "#ui/components/ui/textarea"

type CourseStatus = "draft" | "preview" | "live"
type CoursePatternKind = "dots" | "lines" | "grid" | "rings"

type CourseRow = {
  id: string
  title: string
  topic: string
  level: string
  description?: string
  status: CourseStatus
  lessons: number
  learners: number
  updatedAt: string
}

const TOPIC_PATTERN: Record<string, CoursePatternKind> = {
  읽기: "dots",
  회화: "lines",
  듣기: "grid",
  쓰기: "rings",
  문법: "lines",
  어휘: "dots",
  말하기: "rings",
}

function patternForTopic(topic: string): CoursePatternKind {
  return TOPIC_PATTERN[topic] ?? "dots"
}

function CourseThumb({ pattern }: { pattern: CoursePatternKind }) {
  return (
    <div
      data-slot="courses-admin-thumb"
      className="relative size-9 shrink-0 overflow-hidden rounded-xl bg-muted"
      aria-hidden="true"
    >
      {pattern === "dots" ? (
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(circle, color-mix(in oklch, var(--foreground) 28%, transparent) 1px, transparent 1.1px)",
            backgroundSize: "6px 6px",
          }}
        />
      ) : null}
      {pattern === "lines" ? (
        <div
          className="absolute inset-0 opacity-[0.28]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(-18deg, color-mix(in oklch, var(--foreground) 22%, transparent) 0 1px, transparent 1px 5px)",
          }}
        />
      ) : null}
      {pattern === "grid" ? (
        <div
          className="absolute inset-0 opacity-[0.3]"
          style={{
            backgroundImage:
              "linear-gradient(color-mix(in oklch, var(--foreground) 18%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklch, var(--foreground) 18%, transparent) 1px, transparent 1px)",
            backgroundSize: "8px 8px",
          }}
        />
      ) : null}
      {pattern === "rings" ? (
        <>
          <span className="absolute top-1/2 left-1/2 size-7 -translate-x-1/2 -translate-y-1/2 rounded-full border border-foreground/15" />
          <span className="absolute top-1/2 left-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-foreground/20" />
        </>
      ) : null}
      <span className="absolute inset-1 rounded-[0.55rem] border border-border/50" />
    </div>
  )
}

type CreateCourseValues = {
  title: string
  topic: string
  level: string
  description: string
}

const TOPIC_ITEMS = [
  { label: "읽기", value: "읽기" },
  { label: "듣기", value: "듣기" },
  { label: "말하기", value: "말하기" },
  { label: "쓰기", value: "쓰기" },
  { label: "문법", value: "문법" },
  { label: "어휘", value: "어휘" },
  { label: "회화", value: "회화" },
] as const

const LEVEL_ITEMS = [
  { label: "초급", value: "초급" },
  { label: "중급", value: "중급" },
  { label: "고급", value: "고급" },
] as const

const EMPTY_CREATE_VALUES: CreateCourseValues = {
  title: "",
  topic: "회화",
  level: "초급",
  description: "",
}

function todayIsoDate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function nextCourseId(existing: CourseRow[]) {
  let max = 0
  for (const course of existing) {
    const match = /^crs-(\d+)$/.exec(course.id)
    if (match) max = Math.max(max, Number(match[1]))
  }
  return `crs-${String(max + 1).padStart(2, "0")}`
}

const STATUS_LABELS: Record<CourseStatus, string> = {
  draft: "초안",
  preview: "미리보기",
  live: "게시됨",
}

const STATUS_BADGE_VARIANT: Record<
  CourseStatus,
  "outline" | "info" | "success"
> = {
  draft: "outline",
  preview: "info",
  live: "success",
}

const COURSES: CourseRow[] = [
  {
    id: "crs-01",
    title: "인사와 자기소개",
    topic: "회화",
    level: "초급",
    status: "live",
    lessons: 8,
    learners: 4820,
    updatedAt: "2026-08-01",
  },
  {
    id: "crs-02",
    title: "어휘와 문장의 의미 정확히 읽기",
    topic: "읽기",
    level: "중급",
    status: "live",
    lessons: 20,
    learners: 3612,
    updatedAt: "2026-08-03",
  },
  {
    id: "crs-03",
    title: "중급 읽기",
    topic: "읽기",
    level: "중급",
    status: "preview",
    lessons: 16,
    learners: 0,
    updatedAt: "2026-08-04",
  },
  {
    id: "crs-04",
    title: "쓰기 기초",
    topic: "쓰기",
    level: "초급",
    status: "draft",
    lessons: 12,
    learners: 0,
    updatedAt: "2026-08-02",
  },
  {
    id: "crs-05",
    title: "존댓말과 반말",
    topic: "문법",
    level: "초급",
    status: "live",
    lessons: 10,
    learners: 2944,
    updatedAt: "2026-07-28",
  },
  {
    id: "crs-06",
    title: "일상 듣기 연습",
    topic: "듣기",
    level: "초급",
    status: "live",
    lessons: 14,
    learners: 2180,
    updatedAt: "2026-07-30",
  },
  {
    id: "crs-07",
    title: "여행 한국어",
    topic: "회화",
    level: "초급",
    status: "preview",
    lessons: 9,
    learners: 120,
    updatedAt: "2026-08-01",
  },
  {
    id: "crs-08",
    title: "뉴스 읽기 입문",
    topic: "읽기",
    level: "중급",
    status: "draft",
    lessons: 11,
    learners: 0,
    updatedAt: "2026-07-25",
  },
  {
    id: "crs-09",
    title: "이메일과 메시지 쓰기",
    topic: "쓰기",
    level: "중급",
    status: "live",
    lessons: 8,
    learners: 1560,
    updatedAt: "2026-07-22",
  },
  {
    id: "crs-10",
    title: "발음 클리닉",
    topic: "말하기",
    level: "초급",
    status: "live",
    lessons: 6,
    learners: 980,
    updatedAt: "2026-07-18",
  },
  {
    id: "crs-11",
    title: "식당에서 주문하기",
    topic: "회화",
    level: "초급",
    status: "live",
    lessons: 7,
    learners: 4102,
    updatedAt: "2026-07-15",
  },
  {
    id: "crs-12",
    title: "시제와 상",
    topic: "문법",
    level: "중급",
    status: "preview",
    lessons: 13,
    learners: 45,
    updatedAt: "2026-08-03",
  },
  {
    id: "crs-13",
    title: "드라마로 듣기",
    topic: "듣기",
    level: "중급",
    status: "draft",
    lessons: 15,
    learners: 0,
    updatedAt: "2026-07-29",
  },
  {
    id: "crs-14",
    title: "의견 말하기",
    topic: "말하기",
    level: "중급",
    status: "live",
    lessons: 9,
    learners: 1320,
    updatedAt: "2026-07-12",
  },
  {
    id: "crs-15",
    title: "한자 기초 어휘",
    topic: "어휘",
    level: "초급",
    status: "live",
    lessons: 18,
    learners: 870,
    updatedAt: "2026-07-08",
  },
  {
    id: "crs-16",
    title: "면접 한국어",
    topic: "회화",
    level: "고급",
    status: "draft",
    lessons: 10,
    learners: 0,
    updatedAt: "2026-08-04",
  },
  {
    id: "crs-17",
    title: "편지와 카드 쓰기",
    topic: "쓰기",
    level: "초급",
    status: "preview",
    lessons: 5,
    learners: 88,
    updatedAt: "2026-07-31",
  },
  {
    id: "crs-18",
    title: "접속 표현",
    topic: "문법",
    level: "중급",
    status: "live",
    lessons: 12,
    learners: 2011,
    updatedAt: "2026-07-05",
  },
  {
    id: "crs-19",
    title: "날씨와 계절",
    topic: "어휘",
    level: "초급",
    status: "live",
    lessons: 6,
    learners: 3220,
    updatedAt: "2026-06-30",
  },
  {
    id: "crs-20",
    title: "전화 통화 연습",
    topic: "말하기",
    level: "중급",
    status: "preview",
    lessons: 8,
    learners: 64,
    updatedAt: "2026-08-02",
  },
  {
    id: "crs-21",
    title: "쇼핑과 가격",
    topic: "회화",
    level: "초급",
    status: "live",
    lessons: 7,
    learners: 2788,
    updatedAt: "2026-06-28",
  },
  {
    id: "crs-22",
    title: "관용 표현",
    topic: "어휘",
    level: "고급",
    status: "draft",
    lessons: 14,
    learners: 0,
    updatedAt: "2026-07-27",
  },
  {
    id: "crs-23",
    title: "설명문 읽기",
    topic: "읽기",
    level: "중급",
    status: "live",
    lessons: 11,
    learners: 1440,
    updatedAt: "2026-06-20",
  },
  {
    id: "crs-24",
    title: "팟캐스트 듣기",
    topic: "듣기",
    level: "고급",
    status: "preview",
    lessons: 10,
    learners: 210,
    updatedAt: "2026-08-01",
  },
]

const STATUS_FILTER_ITEMS = [
  { label: "전체 상태", value: "all" },
  { label: "초안", value: "draft" },
  { label: "미리보기", value: "preview" },
  { label: "게시됨", value: "live" },
] as const

const PAGE_SIZE_ITEMS = [10, 20, 30, 50].map((size) => ({
  label: String(size),
  value: String(size),
}))

const columns: ColumnDef<CourseRow>[] = [
  {
    accessorKey: "title",
    header: "코스",
    cell: ({ row }) => (
      <div className="flex min-w-0 max-w-[18rem] items-center gap-3">
        <CourseThumb pattern={patternForTopic(row.original.topic)} />
        <div className="min-w-0">
          <p className="truncate font-medium tracking-[-0.01em]">
            {row.original.title}
          </p>
          <p className="truncate text-xs text-muted-foreground tabular-nums">
            {row.original.id}
          </p>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "topic",
    header: "주제",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.topic}
        <span className="text-muted-foreground/70">
          {" "}
          · {row.original.level}
        </span>
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "상태",
    filterFn: (row, id, value) => {
      if (!value || value === "all") return true
      return row.getValue(id) === value
    },
    cell: ({ row }) => {
      const status = row.original.status
      return (
        <Badge variant={STATUS_BADGE_VARIANT[status]}>
          {STATUS_LABELS[status]}
        </Badge>
      )
    },
  },
  {
    accessorKey: "lessons",
    header: () => <div className="text-right">레슨</div>,
    cell: ({ row }) => (
      <div className="text-right tabular-nums text-muted-foreground">
        {row.original.lessons}
      </div>
    ),
  },
  {
    accessorKey: "learners",
    header: () => <div className="text-right">학습자</div>,
    cell: ({ row }) => (
      <div className="text-right tabular-nums text-muted-foreground">
        {row.original.learners.toLocaleString("ko-KR")}
      </div>
    ),
  },
  {
    accessorKey: "updatedAt",
    header: "수정일",
    cell: ({ row }) => (
      <span className="tabular-nums text-muted-foreground">
        {row.original.updatedAt}
      </span>
    ),
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon-sm" className="rounded-full" />
          }
          aria-label={`${row.original.title} 메뉴 열기`}
        >
          <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-40">
          <DropdownMenuItem>열기</DropdownMenuItem>
          <DropdownMenuItem>복제</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">보관</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

function CoursesDataTable({ data }: { data: CourseRow[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "updatedAt", desc: true },
  ])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [globalFilter, setGlobalFilter] = React.useState("")

  // TanStack Table returns mutable callbacks that React Compiler intentionally leaves unmemoized.
  // oxlint-disable-next-line react-hooks-js/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: (row, _columnId, filterValue) => {
      const query = String(filterValue).trim().toLowerCase()
      if (!query) return true
      const { title, topic, level, id } = row.original
      return (
        title.toLowerCase().includes(query) ||
        topic.toLowerCase().includes(query) ||
        level.toLowerCase().includes(query) ||
        id.toLowerCase().includes(query)
      )
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  const filteredCount = table.getFilteredRowModel().rows.length
  const pageIndex = table.getState().pagination.pageIndex
  const pageSize = table.getState().pagination.pageSize
  const pageCount = table.getPageCount()
  const statusFilter =
    (table.getColumn("status")?.getFilterValue() as string | undefined) ?? "all"

  return (
    <div data-slot="courses-admin-table" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
          <div className="relative min-w-[12rem] flex-1 basis-[12rem]">
            <HugeiconsIcon
              icon={Search01Icon}
              strokeWidth={2}
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              value={globalFilter}
              onChange={(event) => setGlobalFilter(event.target.value)}
              placeholder="코스명·주제·ID 검색"
              className="h-9 ps-9"
              aria-label="코스 검색"
            />
          </div>

          <Select
            items={[...STATUS_FILTER_ITEMS]}
            value={statusFilter}
            onValueChange={(value) => {
              const next = Array.isArray(value) ? value[0] : value
              table
                .getColumn("status")
                ?.setFilterValue(next === "all" ? undefined : next)
            }}
          >
            <SelectTrigger
              size="sm"
              className="min-w-[12rem] flex-1 basis-[12rem]"
              aria-label="상태 필터"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              {STATUS_FILTER_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <p className="text-xs tabular-nums text-muted-foreground sm:text-sm">
          검색 결과{" "}
          <span className="font-medium text-foreground">{filteredCount}</span>건
        </p>
      </div>

      <div className="overflow-hidden rounded-[1.5rem] border border-border/70 bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={columns.length}
                  className="h-28 text-center text-muted-foreground"
                >
                  조건에 맞는 코스가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground sm:text-sm">
          <span className="whitespace-nowrap">페이지당 행</span>
          <Select
            items={PAGE_SIZE_ITEMS}
            value={String(pageSize)}
            onValueChange={(value) => {
              const next = Array.isArray(value) ? value[0] : value
              table.setPageSize(Number(next))
            }}
          >
            <SelectTrigger
              size="sm"
              className="w-[4.5rem]"
              aria-label="페이지당 행 개수"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              {PAGE_SIZE_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <p className="text-xs tabular-nums text-muted-foreground sm:text-sm">
            {pageCount === 0 ? "0 / 0" : `${pageIndex + 1} / ${pageCount}`}
          </p>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="rounded-xl"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              aria-label="맨 처음으로 이동"
            >
              <HugeiconsIcon icon={ArrowLeftDoubleIcon} strokeWidth={2} />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="rounded-xl"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="이전 페이지로 이동"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="rounded-xl"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="다음 페이지로 이동"
            >
              <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="rounded-xl"
              onClick={() => table.setPageIndex(pageCount - 1)}
              disabled={!table.getCanNextPage()}
              aria-label="맨 끝으로 이동"
            >
              <HugeiconsIcon icon={ArrowRightDoubleIcon} strokeWidth={2} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function CreateCourseDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (values: CreateCourseValues) => void
}) {
  const [values, setValues] =
    React.useState<CreateCourseValues>(EMPTY_CREATE_VALUES)
  const [titleError, setTitleError] = React.useState<string | null>(null)
  const titleInputRef = React.useRef<HTMLInputElement>(null)
  const titleInvalid = Boolean(titleError)

  React.useEffect(() => {
    if (!open) return
    setValues(EMPTY_CREATE_VALUES)
    setTitleError(null)
  }, [open])

  function updateField<K extends keyof CreateCourseValues>(
    key: K,
    value: CreateCourseValues[K]
  ) {
    setValues((prev) => ({ ...prev, [key]: value }))
    if (key === "title" && titleError) setTitleError(null)
  }

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const title = values.title.trim()
    if (!title) {
      setTitleError("코스 제목을 입력해 주세요.")
      return
    }
    onCreate({
      ...values,
      title,
      description: values.description.trim(),
    })
    onOpenChange(false)
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
            목록에서 구분할 기본 정보만 넣습니다. 유닛·레슨·스텝은 만든 뒤
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
                placeholder="예: 중급 읽기"
                aria-invalid={titleInvalid || undefined}
              />
              {titleError ? <FieldError>{titleError}</FieldError> : null}
            </Field>

            <div className="@container grid gap-5 @[32rem]:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="create-course-topic">주제</FieldLabel>
                <Select
                  items={[...TOPIC_ITEMS]}
                  value={values.topic}
                  onValueChange={(value) => {
                    const next = Array.isArray(value) ? value[0] : value
                    if (typeof next === "string") updateField("topic", next)
                  }}
                >
                  <SelectTrigger id="create-course-topic" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="start">
                    {TOPIC_ITEMS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="create-course-level">수준</FieldLabel>
                <Select
                  items={[...LEVEL_ITEMS]}
                  value={values.level}
                  onValueChange={(value) => {
                    const next = Array.isArray(value) ? value[0] : value
                    if (typeof next === "string") updateField("level", next)
                  }}
                >
                  <SelectTrigger id="create-course-level" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="start">
                    {LEVEL_ITEMS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="create-course-description">
                한줄 설명
              </FieldLabel>
              <Textarea
                id="create-course-description"
                value={values.description}
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
                placeholder="학습자에게 보일 짧은 소개 (선택)"
                className="min-h-20"
              />
              <FieldDescription>
                비워 두어도 됩니다. 편집 화면에서 다듬을 수 있습니다.
              </FieldDescription>
            </Field>
          </FieldGroup>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              취소
            </DialogClose>
            <Button type="submit">초안 만들기</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Admin courses page: shared shell with a TanStack data table for course management.
 */
export function CoursesAdmin({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [courses, setCourses] = React.useState<CourseRow[]>(COURSES)
  const [createOpen, setCreateOpen] = React.useState(false)

  function handleCreateCourse(values: CreateCourseValues) {
    const course: CourseRow = {
      id: nextCourseId(courses),
      title: values.title,
      topic: values.topic,
      level: values.level,
      description: values.description || undefined,
      status: "draft",
      lessons: 0,
      learners: 0,
      updatedAt: todayIsoDate(),
    }
    setCourses((prev) => [course, ...prev])
  }

  return (
    <AdminShell
      data-slot="courses-admin"
      activeNav="courses"
      title="코스"
      className={cn(className)}
      {...props}
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0">
          <h2 className="font-heading text-lg font-semibold tracking-[-0.03em] sm:text-xl">
            코스 목록
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            검색과 상태로 좁혀 보고, 페이지를 넘겨 살펴봅니다.
          </p>
        </div>
        <Button
          type="button"
          className="w-full shrink-0 sm:w-auto"
          onClick={() => setCreateOpen(true)}
        >
          <HugeiconsIcon
            icon={PlusSignIcon}
            strokeWidth={2}
            data-icon="inline-start"
          />
          코스 만들기
        </Button>
      </div>

      <CoursesDataTable data={courses} />

      <CreateCourseDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={handleCreateCourse}
      />
    </AdminShell>
  )
}

export default CoursesAdmin
