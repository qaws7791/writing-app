import Link from "next/link"

import type { DraftSummary } from "@/domain/draft"
import { formatDraftMeta } from "@/foundation/lib/format"

type DraftListItemProps = {
  draft: DraftSummary
  isLast: boolean
}

export function DraftListItem({ draft, isLast }: DraftListItemProps) {
  return (
    <Link href={`/write/${draft.id}`} className="group">
      <article
        className={`flex flex-col gap-1 py-6 transition-colors ${
          !isLast ? "border-b border-border/70" : ""
        }`}
      >
        <h3 className="text-base leading-normal font-semibold text-foreground underline-offset-4 group-hover:underline md:text-lg">
          {draft.title || "제목 없는 초안"}
        </h3>
        <p className="line-clamp-2 text-sm leading-7 font-normal text-muted-foreground md:text-base">
          {draft.preview || "아직 본문이 없습니다."}
        </p>
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground md:text-sm">
          <span>{formatDraftMeta(draft.lastSavedAt)}</span>
          <span className="text-border">·</span>
          <span>{draft.characterCount.toLocaleString("ko-KR")}자</span>
        </div>
      </article>
    </Link>
  )
}
