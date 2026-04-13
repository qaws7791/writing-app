interface MarkdownRendererProps {
  content: string
  className?: string
}

function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div
      className={`prose prose-sm text-on-surface max-w-none ${className ?? ""}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}

function InlineMarkdown({ content, className }: MarkdownRendererProps) {
  return (
    <span
      className={`text-on-surface ${className ?? ""}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}

export { MarkdownRenderer, InlineMarkdown }
