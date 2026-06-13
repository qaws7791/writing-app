import Link from "next/link"

import { BookOpenIcon, UserIcon } from "@workspace/ui/components/icons"

type GlobalNavProps = {
  readonly currentPath?: string
}

const navItems = [
  {
    href: "/app",
    label: "홈",
  },
  {
    href: "/app/courses",
    label: "배우기",
  },
  {
    href: "/app/profile",
    label: "프로필",
  },
] as const

export function GlobalNav({ currentPath }: GlobalNavProps) {
  return (
    <header className="border-b border-border bg-background/95">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4 sm:px-8 lg:px-10">
        <Link className="flex items-center gap-2 font-semibold" href="/app">
          <BookOpenIcon className="text-primary" />
          글결
        </Link>
        <nav aria-label="주요 메뉴" className="flex items-center gap-2">
          {navItems.map((item) => (
            <Link
              aria-current={currentPath === item.href ? "page" : undefined}
              className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground aria-[current=page]:bg-muted aria-[current=page]:text-foreground"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Link
          aria-label="내 프로필 열기"
          className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          href="/app/profile"
        >
          <UserIcon />
        </Link>
      </div>
    </header>
  )
}
