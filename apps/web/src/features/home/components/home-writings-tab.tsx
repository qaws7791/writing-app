import Link from "next/link"
import { formatWritingMeta } from "@/foundation/lib/format"
import type { WritingSummary } from "@/domain/writing"

function WritingListItem({
  writing,
  isLast,
}: {
  writing: WritingSummary
  isLast: boolean
}) {
  return (
    <Link href={`/writing/${writing.id}`} className="group">
      <article
        className={`flex flex-col gap-1 py-6 transition-colors ${
          !isLast ? "border-b border-border/70" : ""
        }`}
      >
        <h3 className="text-base leading-normal font-semibold text-foreground underline-offset-4 group-hover:underline md:text-lg">
          {writing.title || "제목 없는 글"}
        </h3>
        <p className="line-clamp-2 text-sm leading-7 text-muted-foreground md:text-base">
          {writing.preview || "첫 문장을 아직 쓰지 않았습니다."}
        </p>
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground md:text-sm">
          <span>{formatWritingMeta(writing.lastSavedAt)}</span>
          <span className="text-border">·</span>
          <span>{writing.characterCount.toLocaleString("ko-KR")}자</span>
        </div>
      </article>
    </Link>
  )
}

export function HomeWritingsTab({
  writings,
  isLoading,
}: {
  writings: WritingSummary[]
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        작성 중인 글을 불러오는 중입니다.
      </p>
    )
  }

  if (writings.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        아직 작성 중인 글이 없습니다.
      </p>
    )
  }

  return (
    <div className="flex flex-col">
      {writings.map((writing, index) => (
        <WritingListItem
          key={writing.id}
          writing={writing}
          isLast={index === writings.length - 1}
        />
      ))}
    </div>
  )
}
