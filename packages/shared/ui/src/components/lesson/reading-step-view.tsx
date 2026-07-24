import type { ReactNode } from "react"

import { MarkdownContent } from "#ui/components/lesson/markdown-content"

export function ReadingStepView({
  body,
  guide,
  illustration,
  source,
  title,
}: {
  readonly body: string
  readonly guide: string
  readonly illustration?: ReactNode
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
      {illustration === undefined ? null : (
        <div className="mb-6 overflow-hidden rounded-card">{illustration}</div>
      )}
      <MarkdownContent className="mb-6 [&_p]:text-fg-default [&_li]:text-fg-default">
        {body}
      </MarkdownContent>
      {source === undefined ? null : (
        <div
          className="text-fg-muted font-bold"
          style={{ fontSize: "0.8125rem" }}
        >
          출처: {source}
        </div>
      )}
    </div>
  )
}
