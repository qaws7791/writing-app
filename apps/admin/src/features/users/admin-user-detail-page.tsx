import Link from "next/link"
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Flame,
} from "lucide-react"

import { StatusBadge } from "@/components/status-badge"
import type { AdminApiResult } from "@/lib/api/api-result"
import type { AdminUserDetail } from "@/lib/api/admin-api"
import { Alert, AlertDescription } from "@workspace/ui/components/ui/alert"

export function AdminUserDetailPage({
  userResult,
}: {
  readonly userResult: AdminApiResult<AdminUserDetail>
}) {
  if (userResult.status === "error") {
    return (
      <>
        <UserDetailNotFoundHeading />
        <Alert role="alert" tone="danger">
          <AlertDescription>{userResult.error.message}</AlertDescription>
        </Alert>
      </>
    )
  }

  const user = userResult.value
  const progressPercent = user.progressPercent

  return (
    <div>
      <Link
        className="mb-5 inline-flex items-center gap-1 text-[0.875rem] font-bold text-muted-foreground transition-colors hover:text-foreground"
        href="/users"
      >
        <ArrowLeft aria-hidden="true" size={16} />
        사용자 관리
      </Link>
      <div className="mb-5 flex flex-wrap items-center gap-4 rounded-4xl bg-surface p-6">
        <div className="flex size-16 items-center justify-center rounded-full bg-background text-[1.5rem] font-black text-foreground">
          {user.name.slice(0, 1)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="m-0 truncate text-[1.5rem] font-bold text-foreground">
              {user.name}
            </h1>
            <StatusBadge status={user.status} />
          </div>
          <div className="truncate text-[0.9375rem] font-medium text-muted-foreground">
            {user.email}
          </div>
        </div>
      </div>
      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
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
      </div>
      <article className="rounded-4xl border border-surface-hover p-6">
        <h2 className="m-0 mb-4 text-[1.125rem] font-bold text-foreground">
          학습 진도
        </h2>
        <div className="mb-2 flex items-center justify-between text-[0.875rem] font-bold text-muted-foreground">
          <span>전체 진도</span>
          <span className="text-foreground">{progressPercent}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-background">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="mt-3 text-[0.875rem] font-medium text-muted-foreground">
          {user.lessonsDone} / {user.totalLessons} 레슨 완료
        </p>
      </article>
    </div>
  )
}

function UserDetailNotFoundHeading() {
  return (
    <header className="mb-6">
      <h1 className="m-0 text-[2rem] font-bold text-foreground">
        사용자를 찾을 수 없어요
      </h1>
    </header>
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
    <article className="rounded-4xl bg-surface p-5">
      <div className="mb-2 flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-[0.8125rem] font-bold">{label}</span>
      </div>
      <strong className="text-[1.5rem] font-bold text-foreground">
        {value}
      </strong>
    </article>
  )
}
