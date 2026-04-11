"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  ArrowDown01Icon,
  MoreHorizontalIcon,
  Tick02Icon,
  LockIcon,
  Home01Icon,
  BookOpen01Icon,
  QuillWrite01Icon,
  User02Icon,
} from "@hugeicons/core-free-icons"
import { useState } from "react"
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
  { icon: Home01Icon, label: "홈", href: "/home" },
  { icon: BookOpen01Icon, label: "여정", href: "/journeys" },
  { icon: QuillWrite01Icon, label: "글쓰기", href: "/writings" },
  { icon: User02Icon, label: "프로필", href: "/profile" },
] as const

function ProgressSegments({
  total,
  completed,
}: {
  total: number
  completed: number
}) {
  return (
    <div className="flex gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-colors ${
            i < completed ? "bg-on-surface-low" : "bg-surface-container-high"
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
  const [isOpen, setIsOpen] = useState(session.status === "IN_PROGRESS")

  if (session.status === "COMPLETED") {
    return (
      <div className="overflow-hidden rounded-[2.375rem] bg-surface-container-high">
        <button
          onClick={() => setIsOpen((v) => !v)}
          className="flex w-full items-center p-6"
        >
          <div className="flex flex-1 flex-col gap-2.5 text-left">
            <div className="flex items-center gap-2">
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-on-surface-low">
                <HugeiconsIcon
                  icon={Tick02Icon}
                  size={14}
                  color="white"
                  strokeWidth={2}
                />
              </div>
              <span className="text-label-medium-em text-on-surface-low uppercase">
                완료
              </span>
            </div>
            <p className="text-title-medium-em text-on-surface">
              {session.title}
            </p>
          </div>
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            size={24}
            color="currentColor"
            strokeWidth={1.5}
            className={`shrink-0 text-on-surface transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
        {isOpen && session.description && (
          <div className="px-6 pb-6">
            <p className="text-body-large text-on-surface">
              {session.description}
            </p>
          </div>
        )}
      </div>
    )
  }

  if (session.status === "IN_PROGRESS") {
    return (
      <div className="flex flex-col overflow-hidden rounded-[2.375rem] bg-surface-container-high">
        <button
          onClick={() => setIsOpen((v) => !v)}
          className="flex w-full items-start justify-between gap-4 p-6"
        >
          <div className="flex flex-1 flex-col gap-2.5 text-left">
            <div className="flex items-center gap-2">
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-container-high">
                <span className="text-label-medium-em text-on-surface-low">
                  {session.order}
                </span>
              </div>
              <span className="text-label-medium-em text-on-surface-low uppercase">
                진행 중
              </span>
            </div>
            <p className="text-title-large-em text-on-surface">
              {session.title}
            </p>
          </div>
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            size={24}
            color="currentColor"
            strokeWidth={1.5}
            className={`mt-1 shrink-0 text-on-surface transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
        {isOpen && (
          <div className="flex flex-col gap-6 px-6 pb-6">
            {session.description && (
              <p className="text-body-large text-on-surface">
                {session.description}
              </p>
            )}
            <button
              onClick={() => onStart(session.id)}
              className="w-full rounded-full bg-on-surface py-3 text-title-small-em text-surface transition-opacity hover:opacity-90 active:opacity-75"
            >
              지금 시작하기 →
            </button>
          </div>
        )}
      </div>
    )
  }

  // LOCKED
  return (
    <div className="flex items-center rounded-[2.375rem] bg-surface p-6 opacity-60">
      <div className="flex flex-1 flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            icon={LockIcon}
            size={24}
            color="currentColor"
            strokeWidth={1.5}
            className="shrink-0 text-on-surface-low"
          />
          <span className="text-label-medium-em text-on-surface-low uppercase">
            대기 중
          </span>
        </div>
        <p className="text-title-medium-em text-on-surface-low">
          {session.title}
        </p>
      </div>
    </div>
  )
}

export default function JourneyDetailView({
  data,
  onStartSession,
}: {
  data: JourneyDetailData
  onStartSession?: (sessionId: string) => void | Promise<void>
}) {
  const router = useRouter()
  const progressPercent =
    data.totalCount > 0
      ? Math.round((data.completedCount / data.totalCount) * 100)
      : 0

  function handleStartSession(sessionId: string) {
    if (onStartSession) {
      void onStartSession(sessionId)
      return
    }

    router.push(`/journeys/${data.id}/sessions/${sessionId}`)
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3">
        <button
          aria-label="뒤로 가기"
          onClick={() => router.back()}
          className="flex size-10 items-center justify-center rounded-full bg-surface text-on-surface transition-colors hover:bg-surface-container"
        >
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            size={24}
            color="currentColor"
            strokeWidth={1.5}
          />
        </button>
        <span className="flex-1 truncate px-2 text-center text-label-large text-on-surface">
          {data.title}
        </span>
        <button
          aria-label="더보기"
          className="flex size-10 items-center justify-center rounded-full bg-surface text-on-surface transition-colors hover:bg-surface-container"
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
        <div className="mx-4 aspect-4/3 overflow-hidden rounded-[2rem] bg-surface-container-high">
          <img
            src={data.thumbnailUrl}
            alt={data.title}
            className="size-full object-cover"
          />
        </div>

        {/* Journey Header */}
        <div className="flex flex-col gap-4 px-5 pt-6">
          <h1 className="text-headline-large-em text-on-surface">
            {data.title}
          </h1>
          <p className="text-body-large text-on-surface-low opacity-80">
            {data.description}
          </p>
        </div>

        {/* Progress Card */}
        <div className="mx-4 mt-6 flex flex-col gap-4 rounded-[2rem] bg-surface py-6">
          <div className="flex items-end justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-label-large text-on-surface-low">
                전체 진행률
              </span>
              <span className="text-title-large-em text-on-surface">
                {data.completedCount} / {data.totalCount} 세션
              </span>
            </div>
            <span className="text-title-small text-on-surface">
              {progressPercent}% 달성
            </span>
          </div>
          <ProgressSegments
            total={data.totalCount}
            completed={data.completedCount}
          />
        </div>

        {/* Session List */}
        <div className="flex flex-col gap-5 px-4 pt-6 pb-4">
          {data.sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onStart={handleStartSession}
            />
          ))}
        </div>

        {/* Writing CTA after journey completion */}
        {data.completedCount === data.totalCount && data.totalCount > 0 && (
          <div className="px-4 pb-8">
            <button
              type="button"
              onClick={() => router.push("/writings/new")}
              className="flex w-full flex-col gap-2 rounded-3xl bg-secondary-container p-6 text-left transition-colors hover:opacity-90"
            >
              <p className="text-title-medium-em text-on-surface">
                글쓰기 공간에서 배운 내용을 표현해보세요
              </p>
              <p className="text-body-medium text-on-surface-low">
                여정에서 배운 내용을 자유롭게 글로 써보세요
              </p>
            </button>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed right-0 bottom-0 left-0 z-50 flex items-center justify-around rounded-tl-[2rem] rounded-tr-[2rem] border-t border-outline/20 bg-surface/95 px-4 py-4 safe-area-pb shadow-[0px_-12px_40px_0px_rgba(47,52,48,0.04)] backdrop-blur-xl">
        {BOTTOM_NAV_ITEMS.map(({ icon, label, href }) => (
          <button
            key={label}
            onClick={() => router.push(href)}
            className="flex flex-col items-center gap-1 text-on-surface-lowest transition-colors"
          >
            <HugeiconsIcon
              icon={icon}
              size={24}
              color="currentColor"
              strokeWidth={1.5}
            />
            <span className="text-label-medium-em uppercase">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
