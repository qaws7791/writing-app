import * as React from "react"

import { cn } from "../../lib/utils"

function RichText({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="rich-text"
      className={cn(
        "prose prose-sm max-w-none text-body-md font-medium text-fg-default prose-headings:font-black prose-headings:text-fg-default prose-p:text-fg-muted prose-p:leading-7 prose-strong:text-fg-default prose-li:text-fg-muted prose-li:leading-7 prose-code:rounded-md prose-code:bg-bg-surface prose-code:px-1 prose-code:text-fg-default prose-blockquote:border-action-selected-bg prose-blockquote:text-fg-muted prose-hr:border-border-subtle",
        className
      )}
      {...props}
    />
  )
}

export { RichText }
