import type { ReactNode } from "react"

export function WritingFocusShell({
  children,
  footer,
  header,
}: {
  readonly children: ReactNode
  readonly footer?: ReactNode
  readonly header: ReactNode
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="sticky top-0 z-20 shrink-0 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex min-h-16 w-full max-w-3xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          {header}
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-10">
        {children}
      </main>
      {footer === undefined ? null : (
        <footer className="sticky bottom-0 z-20 shrink-0 border-t border-border bg-background/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:px-6">
          <div className="mx-auto flex w-full max-w-3xl justify-end">
            {footer}
          </div>
        </footer>
      )}
    </div>
  )
}
