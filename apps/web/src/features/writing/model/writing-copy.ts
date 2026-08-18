export function formatWritingTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    timeZone: "Asia/Seoul",
  })
}

export function groupWritingsByTask<
  TWriting extends {
    readonly difficulty: string
    readonly domain: string
    readonly taskId: string
    readonly title: string
    readonly typeName: string
  },
>(writings: readonly TWriting[]) {
  const groups: {
    difficulty: TWriting["difficulty"]
    domain: TWriting["domain"]
    pieces: TWriting[]
    taskId: TWriting["taskId"]
    title: TWriting["title"]
    typeName: TWriting["typeName"]
  }[] = []
  const indexByTaskId = new Map<string, number>()

  for (const writing of writings) {
    const index = indexByTaskId.get(writing.taskId)
    if (index === undefined) {
      indexByTaskId.set(writing.taskId, groups.length)
      groups.push({
        difficulty: writing.difficulty,
        domain: writing.domain,
        pieces: [writing],
        taskId: writing.taskId,
        title: writing.title,
        typeName: writing.typeName,
      })
      continue
    }

    const group = groups[index]
    if (group === undefined) continue
    group.pieces.push(writing)
  }

  return groups
}
