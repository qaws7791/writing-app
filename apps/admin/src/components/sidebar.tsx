import Link from "next/link"

const navItems = [
  { href: "/journeys", label: "여정 관리" },
  { href: "/prompts", label: "글감 관리" },
]

export function Sidebar() {
  return (
    <aside className="w-56 shrink-0 border-r border-border bg-muted/30">
      <div className="p-4">
        <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          글필 어드민
        </p>
      </div>
      <nav className="px-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
