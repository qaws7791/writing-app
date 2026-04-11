"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, Cancel01Icon } from "@hugeicons/core-free-icons"

interface SessionHeaderProps {
  journeyTitle: string
  progress: number
  onBack: () => void
  onExit: () => void
}

export function SessionHeader({
  journeyTitle,
  progress,
  onBack,
  onExit,
}: SessionHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex flex-col bg-surface/95 backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          aria-label="나가기"
          onClick={onBack}
          className="flex size-10 items-center justify-center rounded-full text-on-surface transition-colors hover:bg-surface-container"
        >
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            size={24}
            color="currentColor"
            strokeWidth={1.5}
          />
        </button>
        <span className="flex-1 truncate px-2 text-center text-label-large text-on-surface-low">
          {journeyTitle}
        </span>
        <button
          aria-label="닫기"
          onClick={onExit}
          className="flex size-10 items-center justify-center rounded-full text-on-surface transition-colors hover:bg-surface-container"
        >
          <HugeiconsIcon
            icon={Cancel01Icon}
            size={20}
            color="currentColor"
            strokeWidth={1.5}
          />
        </button>
      </div>
      <div className="h-1 w-full bg-surface-container-high">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </header>
  )
}
