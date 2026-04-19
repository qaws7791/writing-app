"use client"

import { Button } from "@workspace/ui/components/ui/button"

interface SessionCtaBarProps {
  label: string
  enabled: boolean
  isSubmitting: boolean
  onClick: () => void
}

export function SessionCtaBar({
  label,
  enabled,
  isSubmitting,
  onClick,
}: SessionCtaBarProps) {
  return (
    <div className="fixed right-0 bottom-0 left-0 z-50 bg-linear-to-t from-background via-background to-transparent px-5 pt-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
      <Button
        variant="default"
        size="lg"
        onClick={onClick}
        disabled={!enabled || isSubmitting}
        className="w-full"
      >
        {isSubmitting ? "저장 중..." : label}
      </Button>
    </div>
  )
}
