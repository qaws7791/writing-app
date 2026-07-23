"use client"

import { useState, useTransition } from "react"
import type { AdminContentResetResultDto } from "@workspace/contracts/content/admin-content-reset"

import type { AdminApiResult } from "@/shared/http/admin-api-result"
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

type StatusMessage = {
  readonly message: string
  readonly revision?: number
  readonly tone: "danger" | "success"
}

export function AdminContentMaintenancePage({
  resetContent,
}: {
  readonly resetContent: () => Promise<
    AdminApiResult<AdminContentResetResultDto>
  >
}) {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<StatusMessage | null>(null)
  const [showResetDialog, setShowResetDialog] = useState(false)

  return (
    <>
      <header className="mb-6">
        <h1 className="m-0 text-[2rem] font-bold text-foreground">
          콘텐츠 유지보수
        </h1>
        <p className="mt-1 text-[1.0625rem] font-medium text-muted-foreground">
          소유자만 실행할 수 있는 콘텐츠 복구 작업입니다.
        </p>
      </header>
      {message === null ? null : (
        <Alert className="mb-4" role="status" tone={message.tone}>
          <AlertDescription className="flex flex-wrap gap-2">
            <span>{message.message}</span>
            {message.revision === undefined ? null : (
              <span>revision {message.revision}</span>
            )}
          </AlertDescription>
        </Alert>
      )}
      <article className="max-w-2xl rounded-4xl bg-surface p-6">
        <h2 className="m-0 mb-2 text-[1.125rem] font-bold text-foreground">
          콘텐츠 초기화
        </h2>
        <p className="m-0 mb-4 text-[0.875rem] font-medium text-muted-foreground">
          기준 콘텐츠 seed로 콘텐츠 baseline을 재시드합니다.
        </p>
        <Button
          onClick={() => setShowResetDialog(true)}
          type="button"
          variant="destructive"
        >
          콘텐츠 초기화
        </Button>
      </article>
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogTitle>콘텐츠 초기화 확인</AlertDialogTitle>
          <AlertDialogDescription>
            현재 active 콘텐츠를 기준 콘텐츠 seed에 맞춰 다시 정렬합니다.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <Button
              disabled={isPending}
              onClick={() => {
                startTransition(async () => {
                  const result = await resetContent()
                  setMessage(
                    result.status === "ok"
                      ? {
                          message: "콘텐츠를 초기화했습니다.",
                          revision: result.value.revision,
                          tone: "success",
                        }
                      : {
                          message: result.error.message,
                          tone: "danger",
                        }
                  )
                  setShowResetDialog(false)
                })
              }}
              size="extra"
              type="button"
              variant="destructive"
            >
              초기화 실행
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
