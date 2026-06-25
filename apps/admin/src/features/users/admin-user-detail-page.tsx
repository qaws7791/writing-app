import { StatusBadge } from "@/components/status-badge"
import type { AdminApiResult } from "@/lib/api/api-result"
import type { AdminUserDetail } from "@/lib/api/admin-api"
import { Alert, AlertDescription } from "@workspace/ui/components/ui/alert"
import { PageHeader } from "@workspace/ui/components/ui/page-header"
import { Surface } from "@workspace/ui/components/ui/surface"

export function AdminUserDetailPage({
  userResult,
}: {
  readonly userResult: AdminApiResult<AdminUserDetail>
}) {
  if (userResult.status === "error") {
    return (
      <>
        <PageHeader
          description="사용자의 학습 상태와 계정 상태를 확인합니다."
          title="사용자 상세"
        />
        <Alert role="alert" tone="danger">
          <AlertDescription>{userResult.error.message}</AlertDescription>
        </Alert>
      </>
    )
  }

  const user = userResult.value

  return (
    <>
      <PageHeader
        description="사용자의 학습 상태와 계정 상태를 확인합니다."
        title="사용자 상세"
      />
      <Surface variant="panel">
        <div className="mb-5 grid gap-1.5">
          <strong className="text-title-lg font-black text-fg-default">
            {user.name}
          </strong>
          <span className="text-body-sm font-semibold text-fg-muted">
            {user.email}
          </span>
          <div>
            <StatusBadge status={user.status} />
          </div>
        </div>
        <dl className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-card border border-border-subtle bg-bg-canvas p-3">
            <dt className="text-label-sm font-bold text-fg-muted">가입일</dt>
            <dd className="m-0 text-body-sm font-black text-fg-default">
              {user.joined}
            </dd>
          </div>
          <div className="rounded-card border border-border-subtle bg-bg-canvas p-3">
            <dt className="text-label-sm font-bold text-fg-muted">최근 접속</dt>
            <dd className="m-0 text-body-sm font-black text-fg-default">
              {user.lastActive ?? "없음"}
            </dd>
          </div>
          <div className="rounded-card border border-border-subtle bg-bg-canvas p-3">
            <dt className="text-label-sm font-bold text-fg-muted">완료 레슨</dt>
            <dd className="m-0 text-body-sm font-black text-fg-default">
              {user.lessonsDone} / {user.totalLessons}
            </dd>
          </div>
          <div className="rounded-card border border-border-subtle bg-bg-canvas p-3">
            <dt className="text-label-sm font-bold text-fg-muted">전체 진도</dt>
            <dd className="m-0 text-body-sm font-black text-fg-default">
              {user.progressPercent}%
            </dd>
          </div>
          <div className="rounded-card border border-border-subtle bg-bg-canvas p-3">
            <dt className="text-label-sm font-bold text-fg-muted">
              연속 학습일
            </dt>
            <dd className="m-0 text-body-sm font-black text-fg-default">
              {user.streak}일 연속
            </dd>
          </div>
        </dl>
      </Surface>
    </>
  )
}
