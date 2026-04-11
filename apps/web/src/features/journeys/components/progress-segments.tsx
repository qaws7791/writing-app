export function ProgressSegments({
  total,
  completed,
}: {
  total: number
  completed: number
}) {
  return (
    <div className="flex gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-colors ${
            i < completed ? "bg-on-surface-low" : "bg-surface-container-high"
          }`}
        />
      ))}
    </div>
  )
}
