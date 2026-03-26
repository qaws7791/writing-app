import Link from "next/link"
import { formatDraftMeta } from "@/foundation/lib/format"
import type { DraftSummary } from "@/domain/draft"

function DraftListItem({
  draft,
  isLast,
}: {
  draft: DraftSummary
  isLast: boolean
}) {
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
        <p className="line-clamp-2 text-sm leading-7 text-muted-foreground md:text-base">
          {draft.preview || "첫 문장을 아직 쓰지 않았습니다."}
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

export function HomeDraftsTab({
  drafts,
  isLoading,
}: {
  drafts: DraftSummary[]
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        작성 중인 글을 불러오는 중입니다.
      </p>
    )
  }

  if (drafts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        아직 작성 중인 글이 없습니다.
      </p>
    )
  }

  return (
    <div className="flex flex-col">
      {drafts.map((draft, index) => (
        <DraftListItem
          key={draft.id}
          draft={draft}
          isLast={index === drafts.length - 1}
        />
      ))}
    </div>
  )
}
