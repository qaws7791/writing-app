import ReactMarkdown from "react-markdown"

import { ProseBody } from "#ui/components/ui/prose"
import { cn } from "#ui/lib/utils"

const markdownClassName =
  "max-w-none [&_h1]:font-heading [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:font-heading [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:font-heading [&_h3]:text-lg [&_h3]:font-semibold [&_code]:rounded-md [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_a]:font-medium [&_a]:underline [&_a]:underline-offset-3 [&_hr]:border-border"

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
