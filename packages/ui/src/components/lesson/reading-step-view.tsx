import { MarkdownContent } from "#ui/components/lesson/markdown-content"

export function ReadingStepView({
  body,
  guide,
  source,
  title,
}: {
  readonly body: string
  readonly guide: string
  readonly source?: string
  readonly title: string
}) {
  return (
    <div className="an-fi">
      <h2 className="font-bold mb-2" style={{ fontSize: "1.5rem" }}>
        {title}
      </h2>
      {guide === "" ? null : (
        <MarkdownContent className="mb-6">{guide}</MarkdownContent>
      )}
      <MarkdownContent className="mb-6 prose-p:text-charcoal/80 prose-li:text-charcoal/80 prose-hr:border-surface">
        {body}
      </MarkdownContent>
      {source === undefined ? null : (
        <div
          className="text-muted-foreground font-bold"
          style={{ fontSize: "0.8125rem" }}
        >
          출처: {source}
        </div>
      )}
    </div>
  )
}
