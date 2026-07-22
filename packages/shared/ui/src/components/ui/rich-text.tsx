import * as React from "react"

import { cn } from "#ui/lib/utils"

function RichText({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="rich-text"
      className={cn(
        "prose max-w-none text-body-md font-medium text-foreground prose-headings:font-black prose-headings:text-foreground prose-p:text-muted-foreground prose-p:leading-7 prose-strong:text-foreground prose-li:text-muted-foreground prose-li:leading-7 prose-code:rounded-md prose-code:bg-surface prose-code:px-1 prose-code:text-foreground prose-blockquote:border-action-selected-bg prose-blockquote:text-muted-foreground prose-hr:border-border/50",
        className
      )}
      {...props}
    />
  )
}

export { RichText }
