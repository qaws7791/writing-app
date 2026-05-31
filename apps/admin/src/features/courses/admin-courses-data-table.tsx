"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  ColumnsIcon,
  SearchIcon,
} from "lucide-react"
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type PaginationState,
  type VisibilityState,
} from "@tanstack/react-table"

import type { AdminCourseListDto } from "@workspace/core/admin"
import { Button } from "@workspace/ui/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@workspace/ui/components/ui/dropdown-menu"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/ui/empty"
import { Input } from "@workspace/ui/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/ui/table"

import { adminCourseColumns } from "@/features/courses/admin-course-columns"
import { createAdminCourseListPath } from "@/features/courses/admin-course-list-search-params"

type AdminCoursesDataTableProps = {
  courses: AdminCourseListDto["courses"]
  pagination: AdminCourseListDto["pagination"]
  query: string
}

const pageSizeOptions = [10, 20, 30, 40, 50] as const

export function AdminCoursesDataTable({
  courses,
  pagination,
  query,
}: AdminCoursesDataTableProps) {
  const router = useRouter()
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const tablePagination = React.useMemo<PaginationState>(
    () => ({
      pageIndex: pagination.page - 1,
      pageSize: pagination.pageSize,
    }),
    [pagination.page, pagination.pageSize]
  )
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: courses,
    columns: adminCourseColumns,
    state: {
      columnVisibility,
      pagination: tablePagination,
    },
    rowCount: pagination.totalCount,
    manualFiltering: true,
    manualPagination: true,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
  })
  const pageCount = Math.max(1, table.getPageCount())

  function navigateToPage(page: number) {
    router.push(
      createAdminCourseListPath({ page, pageSize: pagination.pageSize, query })
    )
  }

  function navigateToPageSize(value: string | null) {
    if (value === null) {
      return
    }

    router.push(
      createAdminCourseListPath({ page: 1, pageSize: Number(value), query })
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 px-4 lg:flex-row lg:items-center lg:justify-between lg:px-6">
        <form action="/courses" className="flex w-full gap-2 lg:max-w-md">
          <input name="page" type="hidden" value="1" />
          <input
            name="pageSize"
            type="hidden"
            value={String(pagination.pageSize)}
          />
          <Input
            aria-label="코스 검색"
            className="w-full"
            defaultValue={query}
            name="query"
            placeholder="코스명 또는 설명 검색"
            type="search"
          />
          <Button size="sm" type="submit" variant="outline">
            <SearchIcon data-icon="inline-start" />
            검색
          </Button>
        </form>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button size="sm" type="button" variant="outline">
                <ColumnsIcon data-icon="inline-start" />
                <span className="hidden lg:inline">컬럼 설정</span>
                <span className="lg:hidden">컬럼</span>
                <ChevronDownIcon data-icon="inline-end" />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-56">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  checked={column.getIsVisible()}
                  key={column.id}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead colSpan={header.colSpan} key={header.id}>
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
            {table.getRowModel().rows.length > 0 ? (
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
              <TableRow>
                <TableCell
                  className="h-40 text-center"
                  colSpan={adminCourseColumns.length}
                >
                  <Empty aria-label="코스 없음" role="status">
                    <EmptyHeader>
                      <EmptyTitle>검색 조건에 맞는 코스가 없습니다.</EmptyTitle>
                      <EmptyDescription>
                        검색어를 바꾸거나 전체 목록으로 돌아가세요.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between px-4">
        <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
          총 {pagination.totalCount}개 코스
        </div>
        <div className="flex w-full items-center gap-8 lg:w-fit">
          <div className="hidden items-center gap-2 lg:flex">
            <span className="text-sm font-medium">페이지당 행 수</span>
            <Select
              onValueChange={navigateToPageSize}
              value={String(pagination.pageSize)}
            >
              <SelectTrigger className="w-20" id="rows-per-page" size="sm">
                <SelectValue placeholder={pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {pageSizeOptions.map((pageSize) => (
                  <SelectItem key={pageSize} value={String(pageSize)}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-fit items-center justify-center text-sm font-medium">
            Page {pagination.page} of {pageCount}
          </div>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Button
              className="hidden size-8 lg:flex"
              disabled={pagination.page <= 1}
              onClick={() => navigateToPage(1)}
              size="icon"
              type="button"
              variant="outline"
            >
              <span className="sr-only">첫 페이지로 이동</span>
              <ChevronsLeftIcon />
            </Button>
            <Button
              className="size-8"
              disabled={pagination.page <= 1}
              onClick={() => navigateToPage(Math.max(1, pagination.page - 1))}
              size="icon"
              type="button"
              variant="outline"
            >
              <span className="sr-only">이전 페이지로 이동</span>
              <ChevronLeftIcon />
            </Button>
            <Button
              className="size-8"
              disabled={pagination.page >= pageCount}
              onClick={() =>
                navigateToPage(Math.min(pageCount, pagination.page + 1))
              }
              size="icon"
              type="button"
              variant="outline"
            >
              <span className="sr-only">다음 페이지로 이동</span>
              <ChevronRightIcon />
            </Button>
            <Button
              className="hidden size-8 lg:flex"
              disabled={pagination.page >= pageCount}
              onClick={() => navigateToPage(pageCount)}
              size="icon"
              type="button"
              variant="outline"
            >
              <span className="sr-only">마지막 페이지로 이동</span>
              <ChevronsRightIcon />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
