export function ProgressSegments({
  total,
  completed,
}: {
  total: number
  completed: number
}) {
  const segments = Array.from({ length: total }, (_, index) => ({
    id: `segment-${index + 1}`,
    filled: index < completed,
  }))

  return (
    <div className="flex gap-2">
      {segments.map((segment) => (
        <div
          key={segment.id}
          className={`h-1.5 flex-1 rounded-full transition-colors ${
            segment.filled ? "bg-accent" : "bg-surface-tertiary"
          }`}
        />
      ))}
    </div>
  )
}
