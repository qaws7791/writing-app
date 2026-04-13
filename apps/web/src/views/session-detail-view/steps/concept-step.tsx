import type { ConceptContent } from "@/views/session-detail-view/types"
import { MarkdownRenderer } from "@/views/session-detail-view/markdown-renderer"

export function ConceptStep({ content }: { content: ConceptContent }) {
  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-title-large-em text-on-surface">{content.title}</h2>
      <div className="prose prose-sm text-on-surface max-w-none leading-relaxed">
        <MarkdownRenderer content={content.body} />
      </div>
      {content.keyTakeaway && (
        <div className="border-primary bg-primary/5 rounded-xl border-l-4 px-4 py-3">
          <p className="text-label-medium-em text-primary mb-1">핵심 요약</p>
          <p className="text-body-medium text-on-surface">
            {content.keyTakeaway}
          </p>
        </div>
      )}
    </div>
  )
}
