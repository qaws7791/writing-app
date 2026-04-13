import type { ConceptContent } from "@/views/session-detail-view/types"
import { MarkdownRenderer } from "@/views/session-detail-view/markdown-renderer"

export function ConceptStep({ content }: { content: ConceptContent }) {
  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-xl leading-8 font-semibold text-foreground">
        {content.title}
      </h2>
      <div className="max-w-none leading-[1.7] text-foreground">
        <MarkdownRenderer content={content.body} />
      </div>
      {content.keyTakeaway && (
        <div className="rounded-xl border-l-4 border-accent bg-accent-soft px-4 py-3">
          <p className="mb-1 text-xs leading-5 font-semibold tracking-wide text-foreground">
            핵심 요약
          </p>
          <p className="text-sm leading-6 text-foreground">
            {content.keyTakeaway}
          </p>
        </div>
      )}
    </div>
  )
}
