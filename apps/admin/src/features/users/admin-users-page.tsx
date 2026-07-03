"use client"

import { useState, useTransition } from "react"
import Link from "next/link"

import { StatusBadge } from "@/components/status-badge"
import type { AdminApiResult } from "@/lib/api/api-result"
import type {
  AdminDeleteUserResult,
  AdminUserDetail,
  AdminUserList,
  ReadAdminUsersInput,
} from "@/lib/api/admin-api"
import {
  learnerAccountStatuses,
  type LearnerOperationalStatus,
} from "@workspace/contracts/status"
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

export function AdminUsersPage({
  deleteUser,
  filters,
  updateUserStatus,
  usersResult,
}: {
  readonly deleteUser: (
    userId: string
  ) => Promise<AdminApiResult<AdminDeleteUserResult>>
  readonly filters: ReadAdminUsersInput
  readonly updateUserStatus: (input: {
    readonly status: LearnerOperationalStatus
    readonly userId: string
  }) => Promise<AdminApiResult<AdminUserDetail>>
  readonly usersResult: AdminApiResult<AdminUserList>
}) {
  const [deleteTarget, setDeleteTarget] = useState<
    AdminUserList["items"][number] | null
  >(null)
  const [message, setMessage] = useState<StatusMessage | null>(null)
  const [isPending, startTransition] = useTransition()

  if (usersResult.status === "error") {
    return (
      <>
        <PageHeader
          description="학습자 상태와 진행 현황을 관리합니다."
          title="사용자 관리"
        />
        <Alert role="alert" tone="danger">
          <AlertDescription>{usersResult.error.message}</AlertDescription>
        </Alert>
      </>
    )
  }

  return (
    <>
      <PageHeader
        description="학습자 상태와 진행 현황을 관리합니다."
        title="사용자 관리"
      />
      <FilterToolbar method="get" aria-label="사용자 필터">
        <FilterToolbarField>
          <FilterToolbarLabel>사용자 검색</FilterToolbarLabel>
          <Input
            aria-label="사용자 검색"
            defaultValue={filters.query}
            name="query"
            placeholder="이름 또는 이메일"
          />
        </FilterToolbarField>
        <FilterToolbarField>
          <FilterToolbarLabel>상태</FilterToolbarLabel>
          <Select aria-label="상태" defaultValue={filters.status} name="status">
            <option value="all">전체</option>
            <option value="active">active</option>
            <option value="suspended">suspended</option>
            <option value="deleted">deleted</option>
          </Select>
        </FilterToolbarField>
        <FilterToolbarField>
          <FilterToolbarLabel>정렬</FilterToolbarLabel>
          <Select aria-label="정렬" defaultValue={filters.sort} name="sort">
            <option value="lastActive">최근 접속</option>
            <option value="joined">가입일</option>
            <option value="lessonsDone">완료 레슨</option>
            <option value="streak">연속 학습일</option>
          </Select>
        </FilterToolbarField>
        <Button variant="outline" type="submit">
          필터 적용
        </Button>
      </FilterToolbar>
      {message === null ? null : (
        <Alert className="mb-4" role="status" tone={message.tone}>
          <AlertDescription>{message.message}</AlertDescription>
        </Alert>
      )}
      <Surface variant="panel">
        <SectionHeader
          title="사용자 목록"
          description={`총 ${usersResult.value.pagination.totalItems}명 · ${usersResult.value.pagination.page}/${usersResult.value.pagination.totalPages} 페이지`}
        />
        <Table>
          <TableCaption className="sr-only">사용자 목록</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">사용자</TableHead>
              <TableHead scope="col">상태</TableHead>
              <TableHead scope="col">최근 접속</TableHead>
              <TableHead scope="col">완료</TableHead>
              <TableHead scope="col">연속</TableHead>
              <TableHead scope="col">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usersResult.value.items.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Link
                    className="font-black text-foreground hover:underline"
                    href={`/users/${user.id}`}
                  >
                    {user.name}
                  </Link>
                  <span className="block text-caption font-semibold text-muted-foreground">
                    {user.email}
                  </span>
                </TableCell>
                <TableCell>
                  <StatusBadge status={user.status} />
                </TableCell>
                <TableCell>{user.lastActive ?? "없음"}</TableCell>
                <TableCell>{user.lessonsDone}개 완료</TableCell>
                <TableCell>{user.streak}일</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      disabled={
                        isPending ||
                        user.status === learnerAccountStatuses.suspended
                      }
                      onClick={() => {
                        startTransition(async () => {
                          const result = await updateUserStatus({
                            status: learnerAccountStatuses.suspended,
                            userId: user.id,
                          })

                          setMessage(
                            result.status === "ok"
                              ? {
                                  message: "사용자 상태를 변경했습니다.",
                                  tone: "success",
                                }
                              : {
                                  message: result.error.message,
                                  tone: "danger",
                                }
                          )
                        })
                      }}
                      type="button"
                    >
                      정지
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={isPending}
                      onClick={() => setDeleteTarget(user)}
                      type="button"
                    >
                      삭제 요청
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Surface>
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null)
          }
        }}
      >
        {deleteTarget === null ? null : (
          <AlertDialogContent>
            <AlertDialogTitle>삭제 요청 처리 확인</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget.email} 계정을 삭제 상태로 전환합니다.
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <Button
                variant="destructive"
                disabled={isPending}
                onClick={() => {
                  const userId = deleteTarget.id

                  startTransition(async () => {
                    const result = await deleteUser(userId)

                    setMessage(
                      result.status === "ok"
                        ? {
                            message: "삭제 요청을 처리했습니다.",
                            tone: "success",
                          }
                        : { message: result.error.message, tone: "danger" }
                    )
                    setDeleteTarget(null)
                  })
                }}
                type="button"
              >
                삭제 처리
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </>
  )
}
