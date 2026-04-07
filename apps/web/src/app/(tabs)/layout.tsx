import BottomNav from "@/foundation/ui/bottom-nav"

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <div className="flex-1 pb-24">{children}</div>
      <BottomNav />
    </div>
  )
}
