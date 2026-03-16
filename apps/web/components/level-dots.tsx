export function LevelDots({
  level,
  showLabel = false,
}: {
  level: 1 | 2 | 3
  showLabel?: boolean
}) {
  const labels = { 1: "초급", 2: "중급", 3: "심화" } as const

  if (showLabel) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-flex items-center gap-0.75">
          {[1, 2, 3].map((i) => (
            <span
              key={i}
              className={`block size-1.25 rounded-full ${
                i <= level ? "bg-foreground" : "bg-border"
              }`}
            />
          ))}
        </span>
        <span className="text-xs text-muted-foreground">{labels[level]}</span>
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-0.75" title={`레벨 ${level}`}>
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={`block size-1.25 rounded-full ${
            i <= level ? "bg-foreground" : "bg-border"
          }`}
        />
      ))}
    </span>
  )
}
