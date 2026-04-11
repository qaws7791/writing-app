"use client"

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
      <button
        onClick={onClick}
        disabled={!enabled || isSubmitting}
        className="w-full rounded-2xl bg-primary px-6 py-4 text-title-small-em text-on-primary transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100"
      >
        {isSubmitting ? "저장 중..." : label}
      </button>
    </div>
  )
}
