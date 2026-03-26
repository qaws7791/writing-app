import Link from "next/link"
import { formatWritingMeta } from "@/foundation/lib/format"
import type { WritingSummary } from "@/domain/writing"

export function ResumeWritingCard({ writing }: { writing: WritingSummary }) {
  return (
    <section className="mb-14">
      <Link
        href={`/writing/${writing.id}`}
        className="group block overflow-hidden rounded-3xl border border-border bg-card px-6 py-6 shadow-sm transition-all hover:border-foreground/15 hover:shadow-md md:px-8"
      >
        <p className="mb-2 text-sm font-medium text-muted-foreground">
          이어서 쓰기
        </p>
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          {writing.title || "제목 없는 글"}
        </h2>
        <p className="mt-2 line-clamp-2 text-sm leading-7 text-muted-foreground">
          {writing.preview || "첫 문장을 아직 쓰지 않았습니다."}
        </p>
        <div className="mt-4 flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <span>{formatWritingMeta(writing.lastSavedAt)}</span>
          <span className="text-border">·</span>
          <span>{writing.characterCount.toLocaleString("ko-KR")}자</span>
        </div>
      </Link>
    </section>
  )
}
