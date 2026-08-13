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

  return (
    <div
      className={cn(
        "flex h-dvh min-h-0 w-full flex-col bg-background text-foreground",
        className
      )}
    >
      <header className="flex shrink-0 items-center gap-3 border-b border-border/50 px-4 py-3 sm:px-6">
        {header}
      </header>
      <div
        className={cn(
          "grid min-h-0 flex-1 grid-cols-1",
          briefOpen && "lg:grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)]",
          showFeedback && "xl:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)]",
          briefOpen &&
            showFeedback &&
            "xl:grid-cols-[minmax(16rem,18rem)_minmax(0,1fr)_minmax(16rem,20rem)]"
        )}
      >
        {briefOpen ? (
          <aside className="hidden min-h-0 overflow-auto border-r border-border/50 p-5 lg:block">
            {brief}
          </aside>
        ) : null}
        {children}
        {showFeedback ? (
          <aside className="hidden min-h-0 border-l border-border/50 p-5 xl:block">
            {feedback}
          </aside>
        ) : null}
      </div>
      {showFeedback ? (
        <div className="border-t border-border/50 p-4 xl:hidden">
          {feedback}
        </div>
      ) : null}
      {notice}
      <footer className="flex shrink-0 flex-wrap items-center gap-3 border-t border-border/50 px-4 py-3 sm:px-6">
        {footer}
      </footer>
    </div>
  )
}
