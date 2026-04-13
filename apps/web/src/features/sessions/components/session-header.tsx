"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, Cancel01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@workspace/ui/components/button"
import { ProgressBar } from "@workspace/ui/components/progress-bar"

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
        <Button isIconOnly variant="ghost" aria-label="나가기" onPress={onBack}>
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            size={24}
            color="currentColor"
            strokeWidth={1.5}
          />
        </Button>
        <span className="flex-1 truncate px-2 text-center text-sm leading-5 font-medium text-muted">
          {journeyTitle}
        </span>
        <Button isIconOnly variant="ghost" aria-label="닫기" onPress={onExit}>
          <HugeiconsIcon
            icon={Cancel01Icon}
            size={20}
            color="currentColor"
            strokeWidth={1.5}
          />
        </Button>
      </div>
      <ProgressBar value={progress}>
        <ProgressBar.Track>
          <ProgressBar.Fill />
        </ProgressBar.Track>
      </ProgressBar>
    </header>
  )
}
