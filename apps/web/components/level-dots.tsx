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
        <span className="inline-flex items-center gap-[3px]">
          {[1, 2, 3].map((i) => (
            <span
              key={i}
              className={`block h-[5px] w-[5px] rounded-full ${
                i <= level ? "bg-[#111111]" : "bg-[#D9D9D9]"
              }`}
            />
          ))}
        </span>
        <span className="text-[12px] text-[#888888]">{labels[level]}</span>
      </span>
    )
  }

  return (
    <span
      className="inline-flex items-center gap-[3px]"
      title={`레벨 ${level}`}
    >
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={`block h-[5px] w-[5px] rounded-full ${
            i <= level ? "bg-[#111111]" : "bg-[#D9D9D9]"
          }`}
        />
      ))}
    </span>
  )
}
