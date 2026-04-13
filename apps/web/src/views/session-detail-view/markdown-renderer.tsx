interface MarkdownRendererProps {
  content: string
  className?: string
}

function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div
      className={`max-w-none text-foreground ${className ?? ""}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}

function InlineMarkdown({ content, className }: MarkdownRendererProps) {
  return (
    <span
      className={`text-foreground ${className ?? ""}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}

export { MarkdownRenderer, InlineMarkdown }
