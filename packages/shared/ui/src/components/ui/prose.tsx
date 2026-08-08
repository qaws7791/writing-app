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
        "space-y-4 text-base leading-7 text-pretty text-foreground/90 [&_blockquote]:border-l [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground [&_h3]:font-heading [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:tracking-[-0.02em] [&_li]:leading-7 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5 [&_p]:leading-7 [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5",
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
