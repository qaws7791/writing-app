"use client"

import { useState, useTransition } from "react"

import type { AdminUserStatus } from "@/entities/learner-account/model/admin-learner-account"
import {
  readUserStatusTransition,
  type UserStatusTransition,
} from "@/features/user-management/model/user-status-transition"
import type { AdminRequestResult } from "@/shared/http/admin-api-client"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@workspace/ui/components/ui/alert-dialog"
import { Button } from "@workspace/ui/components/ui/button"

export type UserOperationTarget = Readonly<{
  email: string
  id: string
  status: AdminUserStatus
}>

export type UserOperationResult = Readonly<{
  message: string
  tone: "danger" | "success"
}>

/**
 * 사용자 목록과 상세가 같은 확인 흐름을 쓰도록 상태 변경·삭제 요청을 한 곳에서 소유한다.
 * 결과 메시지는 화면마다 배치가 달라 호출자가 표시한다.
 */
export function UserOperationActions({
  deleteUser,
  onResult,
  updateUserStatus,
  user,
}: {
  readonly deleteUser: (userId: string) => Promise<AdminRequestResult<unknown>>
  readonly onResult: (result: UserOperationResult) => void
  readonly updateUserStatus: (input: {
    readonly status: UserStatusTransition["targetStatus"]
    readonly userId: string
  }) => Promise<AdminRequestResult<unknown>>
  readonly user: UserOperationTarget
}) {
  const [confirming, setConfirming] = useState<"delete" | "status" | null>(null)
  const [isPending, startTransition] = useTransition()
  const transition = readUserStatusTransition(user.status)

  if (transition === null) {
    return (
      <span className="text-sm font-semibold text-muted-foreground">
        읽기 전용
      </span>
    )
  }

  const close = () => {
    if (!isPending) setConfirming(null)
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={isPending}
          onClick={() => setConfirming("status")}
          type="button"
          variant="outline"
        >
          {transition.label}
        </Button>
        <Button
          disabled={isPending}
          onClick={() => setConfirming("delete")}
          type="button"
          variant="destructive"
        >
          삭제 요청
        </Button>
      </div>
      <AlertDialog
        onOpenChange={(open) => {
          if (!open) close()
        }}
        open={confirming === "status"}
      >
        {confirming !== "status" ? null : (
          <AlertDialogContent>
            <AlertDialogTitle>사용자 상태 변경 확인</AlertDialogTitle>
            <AlertDialogDescription>
              {user.email} 사용자를 확인합니다. {transition.confirmation}
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>취소</AlertDialogCancel>
              <Button
                disabled={isPending}
                onClick={() => {
                  if (isPending) return
                  startTransition(async () => {
                    const result = await updateUserStatus({
                      status: transition.targetStatus,
                      userId: user.id,
                    })

                    onResult(
                      result.status === "ok"
                        ? {
                            message: transition.successMessage,
                            tone: "success",
                          }
                        : { message: result.error.message, tone: "danger" }
                    )
                    setConfirming(null)
                  })
                }}
                size="lg"
                type="button"
              >
                {transition.label} 처리
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>
      <AlertDialog
        onOpenChange={(open) => {
          if (!open) close()
        }}
        open={confirming === "delete"}
      >
        {confirming !== "delete" ? null : (
          <AlertDialogContent>
            <AlertDialogTitle>삭제 요청 처리 확인</AlertDialogTitle>
            <AlertDialogDescription>
              {user.email} 계정을 삭제 상태로 전환합니다.
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>취소</AlertDialogCancel>
              <Button
                disabled={isPending}
                onClick={() => {
                  if (isPending) return
                  startTransition(async () => {
                    const result = await deleteUser(user.id)

                    onResult(
                      result.status === "ok"
                        ? {
                            message: "삭제 요청을 처리했습니다.",
                            tone: "success",
                          }
                        : { message: result.error.message, tone: "danger" }
                    )
                    setConfirming(null)
                  })
                }}
                size="lg"
                type="button"
                variant="destructive"
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
