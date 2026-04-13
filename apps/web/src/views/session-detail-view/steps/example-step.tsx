import type { ExampleContent } from "@/views/session-detail-view/types"

export function ExampleStep({ content }: { content: ExampleContent }) {
  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-xl leading-8 font-semibold text-foreground">
        {content.title}
      </h2>
      <div className="flex flex-col gap-4">
        {content.examples.map((ex, i) => (
          <div
            key={i}
            className="flex flex-col gap-2 rounded-2xl bg-surface-secondary p-4"
          >
            {ex.label && (
              <span className="text-xs leading-5 font-semibold tracking-wide text-muted/80 uppercase">
                {ex.label}
              </span>
            )}
            <p className="text-sm leading-6 whitespace-pre-line text-foreground">
              {ex.text}
            </p>
            {ex.highlights && ex.highlights.length > 0 && (
              <div className="mt-2 flex flex-col gap-1.5 border-t border-separator/80 pt-2">
                {ex.highlights.map((h, hi) => (
                  <p
                    key={hi}
                    className="text-xs leading-5 font-medium text-muted"
                  >
                    <span className="font-[500] text-muted">*</span> {h.comment}
                  </p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      {content.commentary && (
        <p className="text-sm leading-6 text-muted">{content.commentary}</p>
      )}
    </div>
  )
}
