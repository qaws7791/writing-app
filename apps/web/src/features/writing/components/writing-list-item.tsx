import Link from "next/link"

import type { WritingSummary } from "@/domain/writing"
import { formatWritingMeta } from "@/foundation/lib/format"

type WritingListItemProps = {
  writing: WritingSummary
  isLast: boolean
}

export function WritingListItem({ writing, isLast }: WritingListItemProps) {
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
        <p className="line-clamp-2 text-sm leading-7 font-normal text-muted-foreground md:text-base">
          {writing.preview || "아직 본문이 없습니다."}
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
