"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowDown01Icon,
  Tick02Icon,
  LockIcon,
} from "@hugeicons/core-free-icons"
import { Button } from "@workspace/ui/components/button"

export type SessionStatus = "COMPLETED" | "IN_PROGRESS" | "LOCKED"

export interface SessionItem {
  id: string
  order: number
  title: string
  description?: string
  status: SessionStatus
}

export function SessionCard({
  session,
  onStart,
}: {
  session: SessionItem
  onStart: (id: string) => void
}) {
  const [isOpen, setIsOpen] = useState(session.status === "IN_PROGRESS")

  if (session.status === "COMPLETED") {
    return (
      <div className="overflow-hidden rounded-[2.375rem] bg-surface-tertiary">
        <button
          onClick={() => setIsOpen((v) => !v)}
          className="flex w-full items-center p-6"
        >
          <div className="flex flex-1 flex-col gap-2.5 text-left">
            <div className="flex items-center gap-2">
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-success-soft">
                <HugeiconsIcon
                  icon={Tick02Icon}
                  size={14}
                  color="currentColor"
                  strokeWidth={2}
                  className="text-success"
                />
              </div>
              <span className="text-xs leading-5 font-semibold tracking-wide text-muted uppercase">
                완료
              </span>
            </div>
            <p className="text-lg leading-7 font-semibold text-foreground">
              {session.title}
            </p>
          </div>
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            size={24}
            color="currentColor"
            strokeWidth={1.5}
            className={`shrink-0 text-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
        {isOpen && session.description && (
          <div className="px-6 pb-6">
            <p className="text-base leading-7 text-foreground">
              {session.description}
            </p>
          </div>
        )}
      </div>
    )
  }

  if (session.status === "IN_PROGRESS") {
    return (
      <div className="flex flex-col overflow-hidden rounded-[2.375rem] bg-surface-tertiary">
        <button
          onClick={() => setIsOpen((v) => !v)}
          className="flex w-full items-start justify-between gap-4 p-6"
        >
          <div className="flex flex-1 flex-col gap-2.5 text-left">
            <div className="flex items-center gap-2">
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-tertiary">
                <span className="text-xs leading-5 font-semibold tracking-wide text-muted">
                  {session.order}
                </span>
              </div>
              <span className="text-xs leading-5 font-semibold tracking-wide text-muted uppercase">
                진행 중
              </span>
            </div>
            <p className="text-xl leading-8 font-semibold text-foreground">
              {session.title}
            </p>
          </div>
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            size={24}
            color="currentColor"
            strokeWidth={1.5}
            className={`mt-1 shrink-0 text-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
        {isOpen && (
          <div className="flex flex-col gap-6 px-6 pb-6">
            {session.description && (
              <p className="text-base leading-7 text-foreground">
                {session.description}
              </p>
            )}
            <Button
              onClick={() => onStart(session.id)}
              variant="primary"
              fullWidth
              className="rounded-full"
            >
              지금 시작하기 →
            </Button>
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
            className="shrink-0 text-muted"
          />
          <span className="text-xs leading-5 font-semibold tracking-wide text-muted uppercase">
            대기 중
          </span>
        </div>
        <p className="text-lg leading-7 font-semibold text-muted">
          {session.title}
        </p>
      </div>
    </div>
  )
}
