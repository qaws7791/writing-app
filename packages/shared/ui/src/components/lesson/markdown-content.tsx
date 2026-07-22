import ReactMarkdown from "react-markdown"

import { cn } from "#ui/lib/utils"

const markdownClassName =
  "prose max-w-none prose-headings:font-bold prose-headings:text-charcoal prose-p:text-muted-foreground prose-p:font-medium prose-strong:text-charcoal prose-li:text-muted-foreground prose-li:font-medium prose-code:bg-surface prose-code:rounded prose-code:px-1 prose-code:text-charcoal prose-blockquote:border-primary prose-blockquote:text-muted-foreground"

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
