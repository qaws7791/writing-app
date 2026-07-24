import ReactMarkdown from "react-markdown"

import { cn } from "#ui/lib/utils"

const markdownClassName =
  "max-w-none space-y-4 [&_h1]:text-heading-md [&_h2]:text-heading-sm [&_h3]:text-title-lg [&_h1]:font-bold [&_h2]:font-bold [&_h3]:font-bold [&_h1]:text-fg-default [&_h2]:text-fg-default [&_h3]:text-fg-default [&_p]:font-medium [&_p]:text-fg-muted [&_strong]:text-fg-default [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6 [&_li]:font-medium [&_li]:text-fg-muted [&_code]:rounded [&_code]:bg-bg-surface [&_code]:px-1 [&_code]:text-fg-default [&_blockquote]:border-l-4 [&_blockquote]:border-action-primary-bg [&_blockquote]:pl-4 [&_blockquote]:text-fg-muted [&_a]:underline [&_a]:underline-offset-3 [&_hr]:border-border"

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
