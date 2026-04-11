"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, Cancel01Icon } from "@hugeicons/core-free-icons"
import { IconButton } from "@workspace/ui/components/icon-button"
import { LinearProgress } from "@workspace/ui/components/progress"

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
        <IconButton aria-label="나가기" onClick={onBack}>
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            size={24}
            color="currentColor"
            strokeWidth={1.5}
          />
        </IconButton>
        <span className="flex-1 truncate px-2 text-center text-label-large text-on-surface-low">
          {journeyTitle}
        </span>
        <IconButton aria-label="닫기" onClick={onExit}>
          <HugeiconsIcon
            icon={Cancel01Icon}
            size={20}
            color="currentColor"
            strokeWidth={1.5}
          />
        </IconButton>
      </div>
      <LinearProgress value={progress} />
    </header>
  )
}
