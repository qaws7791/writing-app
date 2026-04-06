"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  MoreHorizontalIcon,
  Tick02Icon,
  LockIcon,
  Layers01Icon,
  Home01Icon,
  BookOpen01Icon,
  QuillWrite01Icon,
  User02Icon,
} from "@hugeicons/core-free-icons"
import { useRouter } from "next/navigation"

type SessionStatus = "COMPLETED" | "IN_PROGRESS" | "LOCKED"

interface SessionItem {
  id: string
  order: number
  title: string
  description?: string
  status: SessionStatus
}

interface JourneyDetailData {
  id: string
  title: string
  description: string
  thumbnailUrl: string
  completedCount: number
  totalCount: number
  sessions: SessionItem[]
}

const BOTTOM_NAV_ITEMS = [
  { icon: Home01Icon, label: "홈" },
  { icon: BookOpen01Icon, label: "나의 여정" },
  { icon: QuillWrite01Icon, label: "서재" },
  { icon: User02Icon, label: "프로필" },
] as const

function ProgressDots({
  total,
  completed,
}: {
  total: number
  completed: number
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`size-2 rounded-full transition-colors ${
            i < completed ? "bg-on-surface" : "bg-surface-container-high"
          }`}
        />
      ))}
    </div>
  )
}

function SessionCard({
  session,
  onStart,
}: {
  session: SessionItem
  onStart: (id: string) => void
}) {
  if (session.status === "COMPLETED") {
    return (
      <div className="flex items-center gap-4 rounded-2xl bg-surface-container-low px-4 py-3.5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-on-surface">
          <HugeiconsIcon
            icon={Tick02Icon}
            size={18}
            color="var(--color-surface)"
            strokeWidth={2}
          />
        </div>
        <p className="flex-1 text-base font-medium text-on-surface-low line-through decoration-on-surface-lowest">
          {session.title}
        </p>
      </div>
    )
  }

  if (session.status === "IN_PROGRESS") {
    return (
      <div className="flex flex-col gap-3 rounded-2xl bg-surface-container p-4">
        <div className="flex items-center gap-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-on-surface">
            <span className="text-sm font-bold text-surface">
              {session.order}
            </span>
          </div>
          <p className="flex-1 text-base font-semibold text-on-surface">
            {session.title}
          </p>
        </div>
        {session.description && (
          <p className="pl-13 text-sm leading-relaxed text-on-surface-low">
            {session.description}
          </p>
        )}
        <div className="pl-13">
          <button
            onClick={() => onStart(session.id)}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90 active:opacity-75"
          >
            지금 시작하기 →
          </button>
        </div>
      </div>
    )
  }

  // LOCKED
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-surface-container-low px-4 py-3.5 opacity-40">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-container-high">
        <HugeiconsIcon
          icon={LockIcon}
          size={16}
          color="currentColor"
          strokeWidth={1.5}
          className="text-on-surface-low"
        />
      </div>
      <p className="flex-1 text-base font-medium text-on-surface-low">
        {session.title}
      </p>
    </div>
  )
}

export default function JourneyDetailView({
  data,
}: {
  data: JourneyDetailData
}) {
  const router = useRouter()
  const progressPercent =
    data.totalCount > 0
      ? Math.round((data.completedCount / data.totalCount) * 100)
      : 0

  function handleStartSession(sessionId: string) {
    router.push(`/journeys/${data.id}/sessions/${sessionId}`)
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between bg-surface/95 px-4 py-3 backdrop-blur-xl">
        <button
          aria-label="뒤로 가기"
          onClick={() => router.back()}
          className="flex size-10 items-center justify-center rounded-full text-on-surface transition-colors hover:bg-surface-container"
        >
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            size={24}
            color="currentColor"
            strokeWidth={1.5}
          />
        </button>
        <span className="flex-1 truncate px-2 text-center text-sm font-semibold text-on-surface">
          {data.title}
        </span>
        <button
          aria-label="더보기"
          className="flex size-10 items-center justify-center rounded-full text-on-surface transition-colors hover:bg-surface-container"
        >
          <HugeiconsIcon
            icon={MoreHorizontalIcon}
            size={24}
            color="currentColor"
            strokeWidth={1.5}
          />
        </button>
      </header>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-24">
        {/* Hero Image */}
        <div className="aspect-2/1 w-full overflow-hidden bg-surface-container-high">
          <img
            src={data.thumbnailUrl}
            alt={data.title}
            className="size-full object-cover"
          />
        </div>

        {/* Journey Header */}
        <div className="flex flex-col gap-4 px-5 pt-6">
          <h1 className="text-3xl leading-tight font-semibold tracking-tight text-on-surface">
            {data.title}
          </h1>
          <p className="text-base leading-relaxed text-on-surface-low">
            {data.description}
          </p>
        </div>

        {/* Progress Card */}
        <div className="mx-4 mt-6 flex flex-col gap-4 rounded-2xl bg-surface-container p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-on-surface-low">
              전체 진행률
            </span>
            <div className="flex items-center gap-1.5">
              <HugeiconsIcon
                icon={Layers01Icon}
                size={14}
                color="currentColor"
                strokeWidth={1.5}
                className="text-on-surface-low"
              />
              <span className="text-sm font-medium text-on-surface-low">
                {data.completedCount} / {data.totalCount} 세션
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-surface-container-high">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-on-surface transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="w-10 shrink-0 text-right text-sm font-bold text-on-surface tabular-nums">
              {progressPercent}%
            </span>
          </div>
          <ProgressDots
            total={data.totalCount}
            completed={data.completedCount}
          />
        </div>

        {/* Session List */}
        <div className="flex flex-col gap-3 px-4 pt-6 pb-4">
          {data.sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onStart={handleStartSession}
            />
          ))}
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed right-0 bottom-0 left-0 z-50 flex items-center justify-around rounded-tl-[2rem] rounded-tr-[2rem] border-t border-outline/20 bg-surface/95 px-4 py-4 safe-area-pb shadow-[0px_-12px_40px_0px_rgba(47,52,48,0.04)] backdrop-blur-xl">
        {BOTTOM_NAV_ITEMS.map(({ icon, label }, index) => {
          const isActive = index === 1
          return (
            <button
              key={label}
              className={`flex flex-col items-center gap-1 transition-colors ${
                isActive ? "text-primary" : "text-on-surface-lowest"
              }`}
            >
              <HugeiconsIcon
                icon={icon}
                size={24}
                color="currentColor"
                strokeWidth={isActive ? 2 : 1.5}
              />
              <span className="text-[11px] font-semibold tracking-wide uppercase">
                {label}
              </span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
