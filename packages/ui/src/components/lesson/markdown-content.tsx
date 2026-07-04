import ReactMarkdown from "react-markdown"

import { cn } from "../../lib/utils"

const markdownClassName =
  "prose prose-sm max-w-none prose-headings:font-bold prose-headings:text-charcoal prose-p:text-muted prose-p:font-medium prose-strong:text-charcoal prose-li:text-muted prose-li:font-medium prose-code:bg-surface prose-code:rounded prose-code:px-1 prose-code:text-charcoal prose-blockquote:border-primary prose-blockquote:text-muted"

export function MarkdownContent({
  children,
  className,
}: {
  readonly children: string
  readonly className?: string
}) {
  return (
    <div className={cn(markdownClassName, className)}>
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  )
}
