import type { ExampleStepContent } from "@workspace/core/modules/journeys"

export function ExampleStep({ content }: { content: ExampleStepContent }) {
  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-xl leading-8 font-semibold text-foreground">
        {content.title}
      </h2>
      <div className="flex flex-col gap-4">
        {content.examples.map((ex) => (
          <div
            key={ex.label ? `${ex.label}-${ex.text}` : ex.text}
            className="flex flex-col gap-2 rounded-2xl bg-muted p-4"
          >
            {ex.label && (
              <span className="text-xs leading-5 font-semibold tracking-wide text-muted-foreground/80 uppercase">
                {ex.label}
              </span>
            )}
            <p className="text-sm leading-6 whitespace-pre-line text-foreground">
              {ex.text}
            </p>
            {ex.highlights && ex.highlights.length > 0 && (
              <div className="mt-2 flex flex-col gap-1.5 border-t border-border/80 pt-2">
                {ex.highlights.map((highlight) => (
                  <p
                    key={highlight.comment}
                    className="text-xs leading-5 font-medium text-muted-foreground"
                  >
                    <span className="font-[500] text-muted-foreground">*</span>{" "}
                    {highlight.comment}
                  </p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      {content.commentary && (
        <p className="text-sm leading-6 text-muted-foreground">
          {content.commentary}
        </p>
      )}
    </div>
  )
}
