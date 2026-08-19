import ReactMarkdown from "react-markdown"

import { ProseBody } from "#ui/components/learning/prose"
import { cn } from "#ui/lib/utils"

const markdownClassName =
  "max-w-none [&_code]:rounded-md [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_a]:font-medium [&_a]:underline [&_a]:underline-offset-3 [&_hr]:border-border"

export function MarkdownContent({
  children,
  className,
}: {
  readonly children: string
  readonly className?: string
}) {
  return (
    <ProseBody className={cn(markdownClassName, className)}>
      <ReactMarkdown>{children}</ReactMarkdown>
    </ProseBody>
  )
}
