import { GlobalNav } from "@/components/layout/global-nav"

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <GlobalNav />
      <main className="min-h-svh pb-[calc(4rem+env(safe-area-inset-bottom))] md:pt-14 md:pb-0">
        {children}
      </main>
    </div>
  )
}
