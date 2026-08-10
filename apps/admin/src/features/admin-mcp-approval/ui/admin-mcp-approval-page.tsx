"use client"

import Link from "next/link"
import { useState, useTransition } from "react"

import type { AdminMcpApproval } from "@/entities/admin-mcp-approval/model/admin-mcp-approval"
import type { decideAdminMcpApprovalAction } from "@/features/admin-mcp-approval/server/admin-mcp-approval-actions"
import { AdminPageHeader } from "@/shared/ui/admin-page-header"
import { Alert, AlertDescription } from "@workspace/ui/components/ui/alert"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@workspace/ui/components/ui/alert-dialog"
import { Badge } from "@workspace/ui/components/ui/badge"
import { Button } from "@workspace/ui/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/ui/card"

type DecisionAction = typeof decideAdminMcpApprovalAction
type Decision = "approve" | "reject"

const statusPresentation = {
  approved: { label: "승인됨", variant: "info" },
  executing: { label: "실행 중", variant: "info" },
  expired: { label: "만료됨", variant: "secondary" },
  failed: { label: "실패", variant: "destructive" },
  pending: { label: "검토 대기", variant: "warning" },
  rejected: { label: "거절됨", variant: "secondary" },
  succeeded: { label: "완료", variant: "success" },
} as const

const toolPresentation = {
  admin_archive_course: {
    approveLabel: "보관 승인",
    description:
      "활성 강의를 보관 상태로 바꿉니다. 학습자 화면에서 강의를 더 이상 제공하지 않습니다.",
    title: "강의 보관",
  },
  admin_create_course_draft: {
    approveLabel: "생성 승인",
    description:
      "관리자 편집용 빈 강의 초안을 생성합니다. 생성 후 공개하려면 별도의 게시 작업이 필요합니다.",
    title: "강의 초안 생성",
  },
  admin_delete_user: {
    approveLabel: "사용자 삭제 승인",
    description:
      "사용자를 삭제 상태로 전환합니다. 사용자 세션을 해제하고 보존 기간이 지난 데이터를 정리 대상으로 등록합니다.",
    title: "사용자 삭제",
  },
  admin_publish_course: {
    approveLabel: "발행 승인",
    description:
      "검증된 강의 초안을 새 커리큘럼 revision으로 발행합니다. 발행된 revision은 수정할 수 없습니다.",
    title: "강의 발행",
  },
  admin_restore_course: {
    approveLabel: "보관 해제 승인",
    description:
      "보관된 강의를 활성 상태로 되돌립니다. 기존 게시 상태가 있으면 학습자 제공이 다시 가능해집니다.",
    title: "강의 보관 해제",
  },
  admin_set_user_status: {
    approveLabel: "상태 변경 승인",
    description:
      "사용자를 활성 또는 정지 상태로 전환합니다. 정지 전환은 기존 사용자 세션을 해제합니다.",
    title: "사용자 상태 변경",
  },
} as const satisfies Record<
  AdminMcpApproval["toolName"],
  Readonly<{ approveLabel: string; description: string; title: string }>
>

export function AdminMcpApprovalPage({
  approval: initialApproval,
  decideApproval,
}: {
  readonly approval: AdminMcpApproval
  readonly decideApproval: DecisionAction
}) {
  const [approval, setApproval] = useState(initialApproval)
  const [confirming, setConfirming] = useState<Decision | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const presentation = toolPresentation[approval.toolName]
  const status = statusPresentation[approval.status]
  const canDecide = approval.status === "pending"
  const destructiveApproval = isDestructiveApproval(approval)

  const decide = (decision: Decision) => {
    if (isPending) return
    setErrorMessage(null)
    startTransition(async () => {
      const result = await decideApproval({
        approvalId: approval.id,
        decision,
      })
      if (result.status === "error") {
        setErrorMessage(result.error.message)
      } else {
        setApproval(result.value)
      }
      setConfirming(null)
    })
  }

  return (
    <div className="min-h-screen bg-muted/25">
      <header className="border-b border-border/70 bg-background/90">
        <div className="mx-auto flex min-h-16 w-full max-w-3xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <Link
            className="font-heading text-lg font-semibold tracking-[-0.02em]"
            href="/"
          >
            글결 관리자
          </Link>
          <Badge variant="purple">AI 변경 승인</Badge>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
        <AdminPageHeader
          description="AI 에이전트가 요청한 변경을 확인한 뒤 승인하거나 거절해 주세요. 승인 전에는 대상이 변경되지 않습니다."
          title="변경 요청 검토"
        />

        {errorMessage === null ? null : (
          <Alert className="mb-5" variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {approval.status === "approved" || approval.status === "executing" ? (
          <div
            className="mb-5 rounded-3xl border border-info/25 bg-info/6 px-5 py-4 text-sm leading-6 text-info"
            role="status"
          >
            변경 요청을 승인했습니다. AI 에이전트가 요청을 재개하면 변경을
            실행합니다.
          </div>
        ) : null}

        {approval.status === "succeeded" ? (
          <div
            className="mb-5 rounded-3xl border border-success/25 bg-success/6 px-5 py-4 text-sm leading-6 text-success"
            role="status"
          >
            승인한 변경이 완료되었습니다.
          </div>
        ) : null}

        <Card size="lg">
          <CardHeader>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant={status.variant}>{status.label}</Badge>
              <span className="text-xs font-medium text-muted-foreground">
                {approval.id}
              </span>
            </div>
            <CardTitle className="text-xl">{presentation.title}</CardTitle>
            <CardDescription>{presentation.description}</CardDescription>
          </CardHeader>

          <CardContent>
            <dl className="grid gap-x-8 gap-y-5 rounded-3xl bg-muted/55 p-5 sm:grid-cols-2">
              <ApprovalTargetDetails target={approval.target} />
              <ApprovalDetail
                label="요청 클라이언트"
                value={approval.oauthClientId}
              />
              <ApprovalDetail
                label="요청 시각"
                value={formatDateTime(approval.createdAt)}
              />
              <ApprovalDetail
                label="승인 만료 시각"
                value={formatDateTime(approval.expiresAt)}
              />
            </dl>
          </CardContent>

          <CardFooter className="flex-col items-stretch gap-4 border-t sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-6 text-muted-foreground">
              요청 내용이 예상과 다르면 거절하세요. 만료되거나 처리된 요청은
              다시 결정할 수 없습니다.
            </p>
            <div className="flex shrink-0 gap-2">
              <Button
                disabled={!canDecide || isPending}
                onClick={() => setConfirming("reject")}
                type="button"
                variant="outline"
              >
                거절
              </Button>
              <Button
                disabled={!canDecide || isPending}
                onClick={() => setConfirming("approve")}
                type="button"
                variant={destructiveApproval ? "destructive" : "default"}
              >
                {presentation.approveLabel}
              </Button>
            </div>
          </CardFooter>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link
            className="font-semibold text-foreground underline decoration-foreground/25 underline-offset-4 hover:decoration-foreground/70"
            href="/"
          >
            관리자 홈으로 이동
          </Link>
        </p>
      </main>

      <DecisionDialog
        decision="approve"
        isPending={isPending}
        onConfirm={() => decide("approve")}
        onOpenChange={(open) => setConfirming(open ? "approve" : null)}
        open={confirming === "approve"}
        presentation={presentation}
        destructive={destructiveApproval}
      />
      <DecisionDialog
        decision="reject"
        isPending={isPending}
        onConfirm={() => decide("reject")}
        onOpenChange={(open) => setConfirming(open ? "reject" : null)}
        open={confirming === "reject"}
        presentation={presentation}
        destructive={destructiveApproval}
      />
    </div>
  )
}

function ApprovalTargetDetails({
  target,
}: {
  target: AdminMcpApproval["target"]
}) {
  if (
    target.kind === "course-create" ||
    target.kind === "course-lifecycle" ||
    target.kind === "course-publish"
  ) {
    return (
      <>
        <ApprovalDetail label="대상 강의" value={target.title} />
        <ApprovalDetail label="강의 ID" value={target.courseId} />
        <ApprovalDetail label="편집 버전" value={String(target.editVersion)} />
      </>
    )
  }

  return (
    <>
      <ApprovalDetail label="사용자 ID" value={target.userId} />
      <ApprovalDetail
        label="현재 상태"
        value={readUserStatusLabel(target.expectedStatus)}
      />
      <ApprovalDetail
        label="변경 상태"
        value={
          target.kind === "user-status"
            ? readUserStatusLabel(target.targetStatus)
            : "삭제"
        }
      />
    </>
  )
}

function ApprovalDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="mb-1 text-xs font-semibold text-muted-foreground">
        {label}
      </dt>
      <dd className="break-words font-medium">{value}</dd>
    </div>
  )
}

function DecisionDialog({
  decision,
  destructive,
  isPending,
  onConfirm,
  onOpenChange,
  open,
  presentation,
}: {
  decision: Decision
  destructive: boolean
  isPending: boolean
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
  open: boolean
  presentation: (typeof toolPresentation)[keyof typeof toolPresentation]
}) {
  const approving = decision === "approve"
  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogTitle>
          {approving
            ? `${presentation.title} 요청을 승인할까요?`
            : "요청을 거절할까요?"}
        </AlertDialogTitle>
        <AlertDialogDescription>
          {approving
            ? "승인 후 AI 에이전트가 요청을 재개하면 검증된 변경을 한 번만 실행합니다."
            : "거절한 요청은 실행할 수 없습니다. 같은 작업에는 새 요청이 필요합니다."}
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>취소</AlertDialogCancel>
          <Button
            disabled={isPending}
            onClick={onConfirm}
            type="button"
            variant={approving && !destructive ? "default" : "destructive"}
          >
            {approving ? "승인" : "거절"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function isDestructiveApproval(approval: AdminMcpApproval): boolean {
  if (
    approval.toolName === "admin_archive_course" ||
    approval.toolName === "admin_publish_course" ||
    approval.toolName === "admin_delete_user"
  ) {
    return true
  }
  return (
    approval.toolName === "admin_set_user_status" &&
    approval.target.kind === "user-status" &&
    approval.target.targetStatus === "suspended"
  )
}

function readUserStatusLabel(status: "active" | "suspended"): string {
  return status === "active" ? "활성" : "정지"
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(new Date(value))
}
