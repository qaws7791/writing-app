"use client"

import { useRef, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { SearchIcon } from "@workspace/ui/components/icons"
import { StatusBadge } from "@/entities/learner-account/ui/status-badge"
import type { AdminRequestResult } from "@/shared/http/admin-api-client"
import type {
  AdminDeleteUserResult,
  AdminUserDetail,
  AdminUserList,
  ReadAdminUsersInput,
} from "@/entities/learner-account/model/admin-learner-account"
import type { LearnerOperationalStatus } from "@workspace/contracts/identity/status"
import {
  createGetFilterHref,
  readGetFormFields,
} from "@/shared/navigation/get-filter-url"
import {
  readUserStatusTransition,
  type UserStatusTransition,
} from "@/features/user-management/model/user-status-transition"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/ui/select"

const userStatusFilterItems = [
  { label: "전체", value: "all" },
  { label: "활성", value: "active" },
  { label: "정지", value: "suspended" },
  { label: "삭제", value: "deleted" },
] as const

const userSortItems = [
  { label: "최근 접속", value: "lastActive" },
  { label: "가입일", value: "joined" },
  { label: "완료 레슨", value: "lessonsDone" },
  { label: "연속 학습일", value: "streak" },
] as const

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
  ) => Promise<AdminRequestResult<AdminDeleteUserResult>>
  readonly filters: ReadAdminUsersInput
  readonly updateUserStatus: (input: {
    readonly status: LearnerOperationalStatus
    readonly userId: string
  }) => Promise<AdminRequestResult<AdminUserDetail>>
  readonly usersResult: AdminRequestResult<AdminUserList>
}) {
  const [deleteTarget, setDeleteTarget] = useState<
    AdminUserList["items"][number] | null
  >(null)
  const [statusTarget, setStatusTarget] = useState<{
    readonly transition: UserStatusTransition
    readonly user: AdminUserList["items"][number]
  } | null>(null)
  const [message, setMessage] = useState<StatusMessage | null>(null)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()

  if (usersResult.status === "error") {
    return (
      <>
        <UsersHeading />
        <Alert role="alert" tone="danger">
          <AlertDescription>{usersResult.error.message}</AlertDescription>
        </Alert>
      </>
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
      <UsersHeading totalUsers={usersResult.value.pagination.totalItems} />
      <form
        ref={formRef}
        aria-label="사용자 필터"
        className="mb-4 flex flex-wrap items-center gap-3"
        method="get"
      >
        <input name="page" type="hidden" value="1" />
        <FilterToolbarField className="relative min-w-[220px] flex-1 gap-0">
          <FilterToolbarLabel className="sr-only">
            사용자 검색
          </FilterToolbarLabel>
          <SearchIcon
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={16}
          />
          <Input
            aria-label="사용자 검색"
            className="pl-10 font-semibold"
            defaultValue={filters.query}
            name="query"
            placeholder="이름 또는 이메일 검색…"
          />
        </FilterToolbarField>
        <FilterToolbarField className="gap-0">
          <FilterToolbarLabel className="sr-only">상태</FilterToolbarLabel>
          <Select
            aria-label="상태"
            value={filters.status}
            items={userStatusFilterItems}
            name="status"
            onValueChange={(value) => {
              submitSelectValue("status", value)
            }}
          >
            <SelectTrigger
              className="w-[140px] font-semibold"
              variant="outlined"
            >
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              {userStatusFilterItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterToolbarField>
        <FilterToolbarField className="gap-0">
          <FilterToolbarLabel className="sr-only">정렬</FilterToolbarLabel>
          <Select
            aria-label="정렬"
            value={filters.sort}
            items={userSortItems}
            name="sort"
            onValueChange={(value) => {
              submitSelectValue("sort", value)
            }}
          >
            <SelectTrigger
              className="w-[160px] font-semibold"
              variant="outlined"
            >
              <SelectValue placeholder="최근 접속" />
            </SelectTrigger>
            <SelectContent>
              {userSortItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterToolbarField>
        <Button type="submit" variant="outline">
          검색
        </Button>
        <span className="ml-auto text-sm font-bold text-muted-foreground">
          {usersResult.value.pagination.totalItems}명
        </span>
      </form>
      {message === null ? null : (
        <Alert className="mb-4" role="status" tone={message.tone}>
          <AlertDescription>{message.message}</AlertDescription>
        </Alert>
      )}
      <div className="overflow-hidden rounded-[24px] border border-border/50">
        <Table className="min-w-[880px]">
          <TableCaption className="sr-only">사용자 목록</TableCaption>
          <TableHeader>
            <TableRow className="border-b border-border/50 bg-transparent">
              <TableHead
                className="px-5 py-3.5 text-[0.8125rem] font-bold text-muted-foreground"
                scope="col"
              >
                사용자
              </TableHead>
              <TableHead
                className="px-5 py-3.5 text-[0.8125rem] font-bold text-muted-foreground"
                scope="col"
              >
                상태
              </TableHead>
              <TableHead
                className="px-5 py-3.5 text-[0.8125rem] font-bold text-muted-foreground"
                scope="col"
              >
                최근 접속
              </TableHead>
              <TableHead
                className="px-5 py-3.5 text-[0.8125rem] font-bold text-muted-foreground"
                scope="col"
              >
                완료
              </TableHead>
              <TableHead
                className="px-5 py-3.5 text-[0.8125rem] font-bold text-muted-foreground"
                scope="col"
              >
                연속
              </TableHead>
              <TableHead
                className="px-5 py-3.5 text-[0.8125rem] font-bold text-muted-foreground"
                scope="col"
              >
                작업
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usersResult.value.items.map((user) => {
              const transition = readUserStatusTransition(user.status)

              return (
                <TableRow
                  className="group border-b border-border/50 last:border-0"
                  key={user.id}
                >
                  <TableCell className="px-5 py-4">
                    <Link
                      className="font-bold text-foreground hover:underline"
                      href={`/users/${user.id}`}
                    >
                      {user.name}
                    </Link>
                    <span className="block text-[0.8125rem] font-medium text-muted-foreground">
                      {user.email}
                    </span>
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <StatusBadge status={user.status} />
                  </TableCell>
                  <TableCell className="px-5 py-4 text-[0.875rem] font-medium">
                    {user.lastActive ?? "없음"}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-[0.875rem] font-medium">
                    {user.lessonsDone}개 완료
                  </TableCell>
                  <TableCell className="px-5 py-4 text-[0.875rem] font-medium">
                    {user.streak}일
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                      {transition === null ? (
                        <span className="text-sm font-semibold text-muted-foreground">
                          읽기 전용
                        </span>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            disabled={isPending}
                            onClick={() =>
                              setStatusTarget({ transition, user })
                            }
                            type="button"
                          >
                            {transition.label}
                          </Button>
                          <Button
                            variant="destructive"
                            disabled={isPending}
                            onClick={() => setDeleteTarget(user)}
                            type="button"
                          >
                            삭제 요청
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      <AlertDialog
        open={statusTarget !== null}
        onOpenChange={(open) => {
          if (!open && !isPending) {
            setStatusTarget(null)
          }
        }}
      >
        {statusTarget === null ? null : (
          <AlertDialogContent>
            <AlertDialogTitle>사용자 상태 변경 확인</AlertDialogTitle>
            <AlertDialogDescription>
              {statusTarget.user.email} 사용자를 확인합니다.{" "}
              {statusTarget.transition.confirmation}
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>취소</AlertDialogCancel>
              <Button
                disabled={isPending}
                size="extra"
                onClick={() => {
                  if (isPending) return

                  const { transition, user } = statusTarget
                  startTransition(async () => {
                    const result = await updateUserStatus({
                      status: transition.targetStatus,
                      userId: user.id,
                    })

                    setMessage(
                      result.status === "ok"
                        ? {
                            message: transition.successMessage,
                            tone: "success",
                          }
                        : {
                            message: result.error.message,
                            tone: "danger",
                          }
                    )
                    setStatusTarget(null)
                  })
                }}
                type="button"
              >
                {statusTarget.transition.label} 처리
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>
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
                size="extra"
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

function UsersHeading({ totalUsers }: { readonly totalUsers?: number }) {
  return (
    <header className="mb-6">
      <h1 className="m-0 text-[2rem] font-bold text-foreground">사용자 관리</h1>
      <p className="mt-1 text-[1.0625rem] font-medium text-muted-foreground">
        {totalUsers === undefined
          ? "학습자 상태와 진행 현황을 관리합니다."
          : `학습자 ${totalUsers}명 · 상태와 진행 현황을 관리합니다.`}
      </p>
    </header>
  )
}
