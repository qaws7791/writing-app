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
    <div className="safe-area-pb fixed right-0 bottom-0 left-0 z-50 bg-linear-to-t from-surface via-surface to-transparent px-5 pt-6">
      <Button
        variant="primary"
        size="lg"
        onPress={onClick}
        isDisabled={!enabled || isSubmitting}
        fullWidth
      >
        {isSubmitting ? "저장 중..." : label}
      </Button>
    </div>
  )
}
