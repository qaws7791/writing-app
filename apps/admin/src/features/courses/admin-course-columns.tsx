"use client"

import Link from "next/link"
import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"

import type { AdminCourseListDto } from "@workspace/core/admin"
import { Badge } from "@workspace/ui/components/ui/badge"

export type AdminCourseRow = AdminCourseListDto["courses"][number]

export const adminCourseColumns: ColumnDef<AdminCourseRow>[] = [
  {
    accessorKey: "title",
    header: "코스명",
    cell: ({ row }) => (
      <div className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted text-sm font-semibold"
        >
          {row.original.title.slice(0, 1)}
        </span>
        <Link
          className="truncate font-medium text-foreground underline-offset-4 hover:underline"
          href={`/courses/${row.original.id}`}
        >
          {row.original.title}
        </Link>
      </div>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "description",
    header: "설명",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.description}</span>
    ),
  },
  {
    accessorKey: "sortOrder",
    header: "정렬",
    cell: ({ row }) => (
      <Badge variant="outline">코스 {row.original.sortOrder}</Badge>
    ),
  },
  {
    id: "actions",
    header: "상세",
    cell: ({ row }) => (
      <Link
        className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        href={`/courses/${row.original.id}`}
      >
        상세 보기
      </Link>
    ),
    enableHiding: false,
  },
]
