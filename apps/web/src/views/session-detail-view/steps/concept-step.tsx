import type { ConceptContent } from "@/views/session-detail-view/types"
import { MarkdownRenderer } from "@/views/session-detail-view/markdown-renderer"

export function ConceptStep({ content }: { content: ConceptContent }) {
  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-xl font-bold text-on-surface">{content.title}</h2>
      <div className="prose prose-sm max-w-none leading-relaxed text-on-surface">
        <MarkdownRenderer text={content.body} />
      </div>
      {content.keyTakeaway && (
        <div className="rounded-xl border-l-4 border-primary bg-primary/5 px-4 py-3">
          <p className="mb-1 text-xs font-semibold text-primary">핵심 요약</p>
          <p className="text-sm leading-relaxed text-on-surface">
            {content.keyTakeaway}
          </p>
        </div>
      )}
    </div>
  )
}
