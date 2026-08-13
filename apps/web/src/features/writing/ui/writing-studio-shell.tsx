import type { ReactNode } from "react"

import { cn } from "@workspace/ui/lib/utils"

export function WritingStudioShell({
  brief,
  briefOpen,
  children,
  className,
  feedback,
  footer,
  header,
  notice,
}: {
  readonly brief?: ReactNode
  readonly briefOpen: boolean
  readonly children: ReactNode
  readonly className?: string
  readonly feedback?: ReactNode
  readonly footer: ReactNode
  readonly header: ReactNode
  readonly notice?: ReactNode
}) {
  const showFeedback = feedback !== undefined
  const centerWriting = !briefOpen && !showFeedback

  return (
    <div
      className={cn(
        "flex h-dvh min-h-0 w-full flex-col bg-background text-foreground",
        className
      )}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:gap-4 sm:px-6 sm:pt-5 sm:pb-5">
        <header className="flex shrink-0 items-center gap-3 px-1 py-1 sm:px-2">
          {header}
        </header>
        <div
          className={cn(
            "grid min-h-0 flex-1 grid-cols-1 gap-3 sm:gap-4",
            briefOpen && "lg:grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)]",
            showFeedback && "xl:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)]",
            briefOpen &&
              showFeedback &&
              "xl:grid-cols-[minmax(16rem,18rem)_minmax(0,1fr)_minmax(16rem,20rem)]"
          )}
        >
          {briefOpen ? (
            <aside className="hidden min-h-0 overflow-auto px-3 py-3 lg:block sm:px-4">
              {brief}
            </aside>
          ) : null}
          <div
            className={cn(
              "flex min-h-0 min-w-0",
              centerWriting && "justify-center"
            )}
          >
            <div
              className={cn(
                "flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-4xl border border-border/40 bg-card has-[:focus-visible]:border-border sm:rounded-5xl",
                centerWriting && "w-full max-w-3xl"
              )}
            >
              {children}
            </div>
          </div>
          {showFeedback ? (
            <aside className="hidden min-h-0 overflow-auto px-3 py-3 xl:block sm:px-4">
              {feedback}
            </aside>
          ) : null}
        </div>
        {showFeedback ? (
          <div className="min-h-0 overflow-auto px-3 xl:hidden">{feedback}</div>
        ) : null}
        {notice}
        <footer
          className={cn(
            "flex shrink-0 flex-wrap items-center gap-3 px-1 py-1 sm:px-2",
            centerWriting && "mx-auto w-full max-w-3xl"
          )}
        >
          {footer}
        </footer>
      </div>
    </div>
  )
}
