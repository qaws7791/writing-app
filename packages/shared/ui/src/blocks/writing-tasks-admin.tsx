"use client"

import * as React from "react"

import { cn } from "#ui/lib/utils"
import { AdminShell } from "#ui/blocks/admin-shell"
import { Badge } from "#ui/components/primitives/badge"
import { Button } from "#ui/components/primitives/button"
import { Input } from "#ui/components/primitives/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#ui/components/primitives/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "#ui/components/primitives/table"

const DOMAINS = [
  "일상·실용문",
  "학업·논술문",
  "업무·비즈니스 문서",
  "창작·문학",
  "설득·의견문",
  "정보전달·설명문",
  "자기서사·기록",
  "관계·소통 문서",
  "공적·행정 문서",
  "디지털·뉴미디어",
] as const

type PublishStatus = "draft" | "published"

type TaskRow = {
  id: string
  title: string
  domain: (typeof DOMAINS)[number]
  typeName: string
  difficulty: "입문" | "기본" | "심화"
  status: PublishStatus
  updatedAt: string
}

const TASKS: TaskRow[] = [
  {
    id: "task-01",
    title: "주말 소풍 초대 메시지",
    domain: "일상·실용문",
    typeName: "초대장",
    difficulty: "입문",
    status: "published",
    updatedAt: "2026-08-12",
  },
  {
    id: "task-02",
    title: "지원 동기 한 문단",
    domain: "자기서사·기록",
    typeName: "자기소개서",
    difficulty: "기본",
    status: "published",
    updatedAt: "2026-08-11",
  },
  {
    id: "task-03",
    title: "숙제 폐지 찬반 칼럼",
    domain: "설득·의견문",
    typeName: "칼럼",
    difficulty: "심화",
    status: "published",
    updatedAt: "2026-08-10",
  },
  {
    id: "task-04",
    title: "민원 신청 초고",
    domain: "공적·행정 문서",
    typeName: "신청서",
    difficulty: "기본",
    status: "draft",
    updatedAt: "2026-08-09",
  },
]

/**
 * Admin writing-task list beside courses in the content group.
 */
export function WritingTasksAdmin({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [query, setQuery] = React.useState("")
  const [domain, setDomain] = React.useState("all")
  const [status, setStatus] = React.useState("all")

  const rows = TASKS.filter((task) => {
    if (domain !== "all" && task.domain !== domain) return false
    if (status !== "all" && task.status !== status) return false
    const haystack = `${task.title} ${task.typeName} ${task.id}`.toLowerCase()
    return haystack.includes(query.trim().toLowerCase())
  })

  return (
    <AdminShell
      data-slot="writing-tasks-admin"
      className={className}
      activeNav="writing-tasks"
      title="쓰기 과제"
      breadcrumb={[{ label: "콘텐츠" }, { label: "쓰기 과제" }]}
      {...props}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <p className="max-w-xl text-sm leading-6 text-pretty text-muted-foreground">
          도메인과 유형을 붙인 과제를 만들고 발행합니다. 학습자는 발행본만
          봅니다.
        </p>
        <Button type="button">새 과제</Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="제목, 유형, ID"
          aria-label="과제 검색"
          className="sm:max-w-64"
        />
        <Select
          items={[
            { label: "모든 도메인", value: "all" },
            ...DOMAINS.map((item) => ({ label: item, value: item })),
          ]}
          value={domain}
          onValueChange={(value) => {
            const next = Array.isArray(value) ? value[0] : value
            if (typeof next === "string") setDomain(next)
          }}
        >
          <SelectTrigger aria-label="도메인" className="sm:w-52">
            <SelectValue placeholder="도메인" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">모든 도메인</SelectItem>
            {DOMAINS.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          items={[
            { label: "모든 상태", value: "all" },
            { label: "초안", value: "draft" },
            { label: "발행됨", value: "published" },
          ]}
          value={status}
          onValueChange={(value) => {
            const next = Array.isArray(value) ? value[0] : value
            if (typeof next === "string") setStatus(next)
          }}
        >
          <SelectTrigger aria-label="상태" className="sm:w-40">
            <SelectValue placeholder="상태" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">모든 상태</SelectItem>
            <SelectItem value="draft">초안</SelectItem>
            <SelectItem value="published">발행됨</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div
        className={cn(
          "overflow-hidden rounded-[1.5rem] border border-border/70"
        )}
      >
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
            {rows.map((task) => (
              <TableRow key={task.id}>
                <TableCell>
                  <p className="font-medium tracking-[-0.01em]">{task.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {task.typeName} · {task.id}
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
                  {task.updatedAt}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AdminShell>
  )
}

export default WritingTasksAdmin
