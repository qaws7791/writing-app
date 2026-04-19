"use client"

import { ArrowLeft, X } from "lucide-react"
import { Button } from "@workspace/ui/components/ui/button"
import { ProgressBar } from "@workspace/ui/components/ui/progress-bar"

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
    <header className="sticky top-0 z-40 flex flex-col bg-background/95 backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 py-3">
        <Button
          size="icon"
          variant="ghost"
          aria-label="나가기"
          onClick={onBack}
        >
          <ArrowLeft size={24} strokeWidth={1.5} />
        </Button>
        <span className="flex-1 truncate px-2 text-center text-sm leading-5 font-medium text-muted-foreground">
          {journeyTitle}
        </span>
        <Button size="icon" variant="ghost" aria-label="닫기" onClick={onExit}>
          <X size={20} strokeWidth={1.5} />
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
