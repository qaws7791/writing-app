import type { ReactNode } from "react"

import { cn } from "@workspace/ui/lib/utils"

export function WritingStudioShell({
  children,
  className,
  footer,
  header,
  notice,
}: {
  readonly children: ReactNode
  readonly className?: string
  readonly footer: ReactNode
  readonly header: ReactNode
  readonly notice?: ReactNode
}) {
  return (
    <div
      className={cn(
        "relative isolate h-dvh min-h-0 w-full bg-background text-foreground",
        className
      )}
    >
      <div className="h-full min-h-0 px-4 pt-[4.75rem] pb-[max(5.75rem,env(safe-area-inset-bottom))] lg:px-6 lg:pt-20 lg:pb-6">
        <div className="mx-auto flex h-full min-h-0 w-full max-w-3xl flex-col">
          <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-4xl border border-border/40 bg-card has-[:focus-visible]:border-border sm:rounded-5xl">
            {children}
          </div>
        </div>
      </div>
      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5">
        <div className="pointer-events-auto mx-auto flex max-w-5xl items-center gap-2 rounded-full border border-border/40 bg-card px-2 py-1.5 shadow-2xs">
          {header}
        </div>
      </header>
      {notice === undefined || notice === null ? null : (
        <div className="pointer-events-none absolute inset-x-0 top-[4.75rem] z-20 px-4 sm:px-6">
          <div className="pointer-events-auto mx-auto max-w-3xl">{notice}</div>
        </div>
      )}
      <footer className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
        <div className="pointer-events-auto mx-auto flex max-w-3xl items-center gap-3 rounded-full border border-border/40 bg-card px-3 py-2 shadow-2xs">
          {footer}
        </div>
      </footer>
    </div>
  )
}
