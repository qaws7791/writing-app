import type { ExampleContent } from "@/views/session-detail-view/types"

export function ExampleStep({ content }: { content: ExampleContent }) {
  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-title-large-em text-on-surface">{content.title}</h2>
      <div className="flex flex-col gap-4">
        {content.examples.map((ex, i) => (
          <div
            key={i}
            className="flex flex-col gap-2 rounded-2xl bg-surface-container p-4"
          >
            {ex.label && (
              <span className="text-label-medium-em text-on-surface-lowest uppercase">
                {ex.label}
              </span>
            )}
            <p className="text-body-medium whitespace-pre-line text-on-surface">
              {ex.text}
            </p>
            {ex.highlights && ex.highlights.length > 0 && (
              <div className="mt-2 flex flex-col gap-1.5 border-t border-outline/10 pt-2">
                {ex.highlights.map((h, hi) => (
                  <p key={hi} className="text-label-medium text-on-surface-low">
                    <span className="font-medium text-primary">*</span>{" "}
                    {h.comment}
                  </p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      {content.commentary && (
        <p className="text-body-medium text-on-surface-low">
          {content.commentary}
        </p>
      )}
    </div>
  )
}
