"use client"

import { Button } from "@workspace/ui/components/button"

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
    <div className="fixed right-0 bottom-0 left-0 z-50 bg-linear-to-t from-surface via-surface to-transparent px-5 pt-6 safe-area-pb">
      <Button
        variant="filled"
        size="lg"
        onClick={onClick}
        disabled={!enabled || isSubmitting}
        loading={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? "저장 중..." : label}
      </Button>
    </div>
  )
}
