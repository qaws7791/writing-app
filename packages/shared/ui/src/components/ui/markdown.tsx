import type { ComponentProps, ReactNode } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { cn } from "#ui/lib/utils"

const internalPathPattern = /^(?:\/|#)/u

function Markdown({
  children,
  className,
}: {
  readonly children: string
  readonly className?: string
}) {
  return (
    <div
      className={cn(
        "prose max-w-none text-body-md font-medium text-foreground prose-headings:font-black prose-headings:text-foreground prose-p:text-muted-foreground prose-p:leading-7 prose-strong:text-foreground prose-li:text-muted-foreground prose-li:leading-7 prose-code:rounded-md prose-code:bg-surface prose-code:px-1 prose-code:text-foreground prose-pre:overflow-x-auto prose-blockquote:border-primary prose-blockquote:text-muted-foreground prose-hr:border-border/50 prose-table:block prose-table:overflow-x-auto prose-th:text-left prose-img:rounded-xl",
        className
      )}
      data-slot="markdown"
    >
      <ReactMarkdown
        components={{ a: MarkdownLink, img: MarkdownImage }}
        remarkPlugins={[remarkGfm]}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}

function MarkdownLink({
  children,
  href,
  ...props
}: ComponentProps<"a">): ReactNode {
  if (href === undefined || !isAllowedLink(href)) {
    return <span>{children}</span>
  }

  const external = href.startsWith("https://")

  return (
    <a
      {...props}
      href={href}
      rel={external ? "noopener noreferrer" : undefined}
      target={external ? "_blank" : undefined}
    >
      {children}
    </a>
  )
}

function MarkdownImage({ alt, src, ...props }: ComponentProps<"img">) {
  if (typeof src !== "string" || !isHttpsUrl(src) || alt === undefined) {
    return null
  }

  return <img {...props} alt={alt} referrerPolicy="no-referrer" src={src} />
}

function isAllowedLink(value: string): boolean {
  return (
    internalPathPattern.test(value) ||
    value.startsWith("mailto:") ||
    isHttpsUrl(value)
  )
}

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:"
  } catch {
    return false
  }
}

export { Markdown }
