"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowDown01Icon,
  Tick02Icon,
  LockIcon,
} from "@hugeicons/core-free-icons"

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
