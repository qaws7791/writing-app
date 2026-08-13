"use client"

import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  PlusIcon,
  SearchIcon,
} from "@workspace/ui/components/icons"
import type { AdminRequestResult } from "@/shared/http/admin-api-client"
import { AdminPageHeader } from "@/shared/ui/admin-page-header"
import type {
  AdminCreatedWritingTask,
  AdminWritingTaskList,
  ReadAdminWritingTasksInput,
} from "@/features/writing-tasks/model/admin-writing-tasks"
import { writingTaskDomainOptions as domains } from "@/features/writing-tasks/model/admin-writing-tasks"
import {
  Alert,
  AlertDescription,
} from "@workspace/ui/components/primitives/alert"
import { Badge } from "@workspace/ui/components/primitives/badge"
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
} from "@workspace/ui/components/primitives/table"
import { Field, FieldLabel } from "@workspace/ui/components/primitives/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/primitives/select"
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

const domainFilterItems = [
  { label: "모든 도메인", value: "all" },
  ...domains.map((item) => ({ label: item, value: item })),
]

const statusFilterItems = [
  { label: "모든 상태", value: "all" },
  { label: "초안", value: "draft" },
  { label: "발행됨", value: "published" },
] as const

const pageSizeItems = [
  { label: "10개", value: "10" },
  { label: "20개", value: "20" },
  { label: "50개", value: "50" },
] as const

export function AdminWritingTasksPage({
  createTask,
  filters,
  tasksResult,
}: {
  readonly createTask: () => Promise<
    AdminRequestResult<AdminCreatedWritingTask>
  >
  readonly filters: ReadAdminWritingTasksInput
  readonly tasksResult: AdminRequestResult<AdminWritingTaskList>
}) {
  const [queryInput, setQueryInput] = useState(filters.query)
  const [syncedQuery, setSyncedQuery] = useState(filters.query)
  const [message, setMessage] = useState<string | null>(null)
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

  const handleCreate = () => {
    startTransition(async () => {
      const result = await createTask()
      if (result.status === "ok") {
        router.push(`/writing-tasks/${result.value.id}`)
        return
      }
      setMessage(result.error.message)
    })
  }

  const createButton = (
    <Button disabled={isPending} onClick={handleCreate} type="button">
      <PlusIcon aria-hidden="true" size={16} />
      새 과제
    </Button>
  )

  if (tasksResult.status === "error") {
    return (
      <>
        <AdminPageHeader
          actions={createButton}
          description="도메인과 유형을 붙인 과제를 만들고 발행합니다. 학습자는 발행본만 봅니다."
        />
        <Alert role="alert" variant="destructive">
          <AlertDescription>{tasksResult.error.message}</AlertDescription>
        </Alert>
      </>
    )
  }

  const tasks = tasksResult.value
  const { page, pageSize, totalItems, totalPages } = tasks.pagination
  const rangeStart = totalItems === 0 ? 0 : (page - 1) * pageSize + 1
  const rangeEnd = Math.min(page * pageSize, totalItems)

  const createPageLink = (pageNumber: number) => {
    return createGetFilterHref(
      [
        ["query", filters.query],
        ["domain", filters.domain],
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
        actions={createButton}
        description="도메인과 유형을 붙인 과제를 만들고 발행합니다. 학습자는 발행본만 봅니다."
      />

      {message === null ? null : (
        <Alert role="alert" variant="destructive">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <form
        aria-label="쓰기 과제 필터"
        className="flex w-full flex-col gap-4"
        method="get"
        ref={formRef}
      >
        <input name="page" type="hidden" value="1" />
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <Field className="gap-0">
            <FieldLabel className="sr-only">과제 검색</FieldLabel>
            <InputGroup>
              <InputGroupAddon>
                <SearchIcon aria-hidden="true" size={16} />
              </InputGroupAddon>
              <InputGroupInput
                aria-label="과제 검색"
                name="query"
                onChange={(event) => setQueryInput(event.target.value)}
                placeholder="제목, 유형, ID"
                type="search"
                value={queryInput}
              />
            </InputGroup>
          </Field>
          <div className="flex gap-3">
            <Field className="gap-0">
              <FieldLabel className="sr-only">도메인</FieldLabel>
              <Select
                items={domainFilterItems}
                name="domain"
                onValueChange={(value) => {
                  submitSelectValue("domain", value)
                }}
                value={filters.domain}
              >
                <SelectTrigger
                  aria-label="도메인"
                  className="w-[14rem]"
                  size="sm"
                >
                  <SelectValue placeholder="모든 도메인" />
                </SelectTrigger>
                <SelectContent>
                  {domainFilterItems.map((item) => (
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
                items={[...statusFilterItems]}
                name="status"
                onValueChange={(value) => {
                  submitSelectValue("status", value)
                }}
                value={filters.status}
              >
                <SelectTrigger
                  aria-label="상태"
                  className="w-[8.5rem]"
                  size="sm"
                >
                  <SelectValue placeholder="모든 상태" />
                </SelectTrigger>
                <SelectContent>
                  {statusFilterItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </div>
        <input name="pageSize" type="hidden" value={String(filters.pageSize)} />
      </form>

      <div className="overflow-hidden rounded-[1.5rem] border border-border/70">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>과제</TableHead>
              <TableHead>도메인</TableHead>
              <TableHead>난이도</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>수정일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.items.length === 0 ? (
              <TableRow>
                <TableCell className="py-8 text-muted-foreground" colSpan={5}>
                  해당하는 과제가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              tasks.items.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>
                    <Link
                      className="font-medium tracking-[-0.01em] text-foreground hover:underline"
                      href={`/writing-tasks/${task.id}`}
                      prefetch={false}
                    >
                      {task.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {task.typeName || "유형 없음"} · {task.id}
                    </p>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {task.domain}
                  </TableCell>
                  <TableCell>{task.difficulty}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        task.status === "published" ? "success" : "outline"
                      }
                    >
                      {task.status === "published" ? "발행됨" : "초안"}
                    </Badge>
                  </TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {new Date(task.updatedAt).toLocaleDateString("ko-KR", {
                      timeZone: "Asia/Seoul",
                    })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <span className="whitespace-nowrap">페이지당 행 수</span>
          <Select
            items={[...pageSizeItems]}
            onValueChange={(value) => {
              submitSelectValue("pageSize", value)
            }}
            value={String(filters.pageSize)}
          >
            <SelectTrigger aria-label="페이지 크기" size="sm">
              <SelectValue placeholder="20개" />
            </SelectTrigger>
            <SelectContent>
              {pageSizeItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <p className="text-xs tabular-nums text-muted-foreground sm:text-sm">
            전체 {totalItems}개 중 {rangeStart} - {rangeEnd}
          </p>
          <div className="flex items-center gap-1">
            <PaginationLink
              className={paginationButtonClassName}
              disabled={page <= 1}
              href={createPageLink(1)}
              label="첫 페이지"
            >
              <ChevronsLeftIcon size={16} />
            </PaginationLink>
            <PaginationLink
              className={paginationButtonClassName}
              disabled={page <= 1}
              href={createPageLink(page - 1)}
              label="이전 페이지"
            >
              <ChevronLeftIcon size={16} />
            </PaginationLink>
            <PaginationLink
              className={paginationButtonClassName}
              disabled={page >= totalPages}
              href={createPageLink(page + 1)}
              label="다음 페이지"
            >
              <ChevronRightIcon size={16} />
            </PaginationLink>
            <PaginationLink
              className={paginationButtonClassName}
              disabled={page >= totalPages}
              href={createPageLink(totalPages)}
              label="마지막 페이지"
            >
              <ChevronsRightIcon size={16} />
            </PaginationLink>
          </div>
        </div>
      </div>
    </>
  )
}

function PaginationLink({
  children,
  className,
  disabled,
  href,
  label,
}: {
  readonly children: ReactNode
  readonly className: string
  readonly disabled: boolean
  readonly href: string
  readonly label: string
}) {
  if (disabled) {
    return (
      <Button
        aria-label={label}
        className="rounded-xl"
        disabled
        size="icon-sm"
        type="button"
        variant="outline"
      >
        {children}
      </Button>
    )
  }

  return (
    <Link aria-label={label} className={className} href={href}>
      {children}
    </Link>
  )
}
