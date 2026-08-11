"use client"

import { useState } from "react"
import {
  CalendarDaysIcon as CalendarDays,
  CheckCircleIcon as CheckCircle2,
  ClockIcon as Clock,
  FlameIcon as Flame,
} from "@workspace/ui/components/icons"

import { useAdminShellChrome } from "@/app/(admin)/_views/admin-shell-chrome"
import { StatusBadge } from "@/entities/learner-account/ui/status-badge"
import {
  UserOperationActions,
  type UserOperationResult,
} from "@/features/user-management/ui/user-operation-actions"
import type { AdminRequestResult } from "@/shared/http/admin-api-client"
import type { AdminUserDetail } from "@/entities/learner-account/model/admin-learner-account"
import type { LearnerOperationalStatus } from "@workspace/contracts/identity/status"
import { Alert, AlertDescription } from "@workspace/ui/components/ui/alert"
import { Card, CardContent } from "@workspace/ui/components/ui/card"
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@workspace/ui/components/ui/progress"

export function AdminUserDetailPage({
  deleteUser,
  updateUserStatus,
  userResult,
}: {
  readonly deleteUser: (userId: string) => Promise<AdminRequestResult<unknown>>
  readonly updateUserStatus: (input: {
    readonly status: LearnerOperationalStatus
    readonly userId: string
  }) => Promise<AdminRequestResult<unknown>>
  readonly userResult: AdminRequestResult<AdminUserDetail>
}) {
  const [message, setMessage] = useState<UserOperationResult | null>(null)

  if (userResult.status === "error") {
    return <UserDetailNotFoundState message={userResult.error.message} />
  }

  return (
    <UserDetailContent
      deleteUser={deleteUser}
      message={message}
      setMessage={setMessage}
      updateUserStatus={updateUserStatus}
      user={userResult.value}
    />
  )
}

function UserDetailNotFoundState({ message }: { readonly message: string }) {
  useAdminShellChrome({
    breadcrumb: [{ href: "/users", label: "사용자 관리" }],
    title: "사용자를 찾을 수 없어요",
  })

  return (
    <Alert role="alert" variant="destructive">
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}

function UserDetailContent({
  deleteUser,
  message,
  setMessage,
  updateUserStatus,
  user,
}: {
  readonly deleteUser: (userId: string) => Promise<AdminRequestResult<unknown>>
  readonly message: UserOperationResult | null
  readonly setMessage: (message: UserOperationResult | null) => void
  readonly updateUserStatus: (input: {
    readonly status: LearnerOperationalStatus
    readonly userId: string
  }) => Promise<AdminRequestResult<unknown>>
  readonly user: AdminUserDetail
}) {
  const progressPercent = user.progressPercent

  useAdminShellChrome({
    breadcrumb: [{ href: "/users", label: "사용자 관리" }],
    title: user.name,
  })

  return (
    <div>
      <Card className="mb-5" size="sm" variant="muted">
        <CardContent className="flex flex-wrap items-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-full bg-card font-heading text-2xl font-semibold text-foreground shadow-xs">
            {user.name.slice(0, 1)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-heading text-2xl font-semibold text-foreground">
                {user.name}
              </p>
              <StatusBadge status={user.status} />
            </div>
            <div className="truncate text-sm font-medium text-muted-foreground">
              {user.email}
            </div>
          </div>
          <UserOperationActions
            deleteUser={deleteUser}
            onResult={setMessage}
            updateUserStatus={updateUserStatus}
            user={user}
          />
        </CardContent>
      </Card>
      {message === null ? null : (
        <Alert
          className="mb-4"
          role="status"
          variant={message.tone === "danger" ? "destructive" : "default"}
        >
          <AlertDescription>{message.message}</AlertDescription>
        </Alert>
      )}
      <dl className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <UserStat
          icon={<CalendarDays aria-hidden="true" size={18} />}
          label="가입일"
          value={user.joined}
        />
        <UserStat
          icon={<Clock aria-hidden="true" size={18} />}
          label="최근 접속"
          value={user.lastActive ?? "없음"}
        />
        <UserStat
          icon={<Flame aria-hidden="true" size={18} />}
          label="현재 스트릭"
          value={`${user.streak}일`}
        />
        <UserStat
          icon={<CheckCircle2 aria-hidden="true" size={18} />}
          label="완료 레슨"
          value={`${user.lessonsDone}개`}
        />
      </dl>
      <Card>
        <CardContent>
          <h2 className="mb-4 font-heading text-lg font-semibold text-foreground">
            학습 진도
          </h2>
          <Progress value={progressPercent}>
            <ProgressLabel>전체 진도</ProgressLabel>
            <ProgressValue />
          </Progress>
          <p className="mt-3 text-sm font-medium text-muted-foreground">
            {user.lessonsDone} / {user.totalLessons} 레슨 완료
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function UserStat({
  icon,
  label,
  value,
}: {
  readonly icon: React.ReactNode
  readonly label: string
  readonly value: string
}) {
  return (
    <Card size="sm" variant="muted">
      <CardContent>
        <div className="mb-2 flex items-center gap-2 text-muted-foreground">
          {icon}
          <dt className="text-xs font-semibold">{label}</dt>
        </div>
        <dd className="font-heading text-2xl font-semibold text-foreground">
          {value}
        </dd>
      </CardContent>
    </Card>
  )
}
