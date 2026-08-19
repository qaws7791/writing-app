import * as React from "react"

import { cn } from "#ui/lib/utils"

function Prose({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="prose"
      className={cn("flex w-full flex-col gap-6 text-left", className)}
      {...props}
    />
  )
}

function ProseFigure({ className, ...props }: React.ComponentProps<"figure">) {
  return (
    <figure
      data-slot="prose-figure"
      className={cn(
        "overflow-hidden rounded-4xl border border-border/70 bg-surface/50 [&_img]:aspect-[16/10] [&_img]:w-full [&_img]:object-cover",
        className
      )}
      {...props}
    />
  )
}

function ProseCaption({
  className,
  ...props
}: React.ComponentProps<"figcaption">) {
  return (
    <figcaption
      data-slot="prose-caption"
      className={cn(
        "px-1 pt-2 text-xs leading-5 text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function ProseBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="prose-body"
      className={cn(
        "space-y-4 text-base leading-7 text-pretty text-foreground/90 [&_blockquote]:rounded-2xl [&_blockquote]:border [&_blockquote]:border-border/70 [&_blockquote]:border-l-2 [&_blockquote]:bg-surface/60 [&_blockquote]:px-4 [&_blockquote]:py-3 [&_blockquote]:text-foreground [&_h2]:mt-8 [&_h2]:font-heading [&_h2]:text-lg [&_h2]:leading-7 [&_h2]:font-semibold [&_h2]:tracking-[-0.01em] [&_h2:first-child]:mt-0 [&_h3]:mt-6 [&_h3]:font-heading [&_h3]:text-lg [&_h3]:leading-7 [&_h3]:font-semibold [&_h3]:tracking-[-0.01em] [&_li]:leading-7 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5 [&_p]:leading-7 [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5",
        className
      )}
      {...props}
    />
  )
}

function ProseSource({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="prose-source"
      className={cn("text-xs leading-5 text-muted-foreground", className)}
      {...props}
    />
  )
}

export { Prose, ProseBody, ProseCaption, ProseFigure, ProseSource }
