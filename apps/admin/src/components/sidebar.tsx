"use client"

import type { SVGProps } from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@workspace/ui"
import { buttonVariants } from "@workspace/ui/components/button"

type IconProps = SVGProps<SVGSVGElement>

const IconDashboard = (props: IconProps) => (
  <svg
    aria-hidden="true"
    fill="none"
    height={16}
    viewBox="0 0 16 16"
    width={16}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      clipRule="evenodd"
      d="M1.5 2.5A1 1 0 0 1 2.5 1.5h3a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1v-3Zm1 .5v2h2v-2h-2ZM9.5 1.5a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1h-3Zm.5 3.5v-2h2v2h-2ZM1.5 9.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1v-3Zm1.5.5v2h2v-2h-2ZM9.5 8.5a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1h-3Zm.5 3.5v-2h2v2h-2Z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
)

const IconMap = (props: IconProps) => (
  <svg
    aria-hidden="true"
    fill="none"
    height={16}
    viewBox="0 0 16 16"
    width={16}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      clipRule="evenodd"
      d="M5.5 1.217A.75.75 0 0 1 6 1.25l4 1.5 3.75-1.5a.75.75 0 0 1 1 .7v10.3a.75.75 0 0 1-.5.707l-4 1.5a.75.75 0 0 1-.5 0l-4-1.5-3.75 1.5A.75.75 0 0 1 1 13.25V2.95a.75.75 0 0 1 .5-.707l4-1.026ZM5.25 3.04 2.5 3.77v8.79l2.75-1.1V3.04Zm1.5.46v8.46l3-1.125V2.375L6.75 3.5Zm4.5-.625v8.46l2.25-.844V2.031l-2.25.844Z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
)

const IconPencil = (props: IconProps) => (
  <svg
    aria-hidden="true"
    fill="none"
    height={16}
    viewBox="0 0 16 16"
    width={16}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      clipRule="evenodd"
      d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Zm1.414 1.06a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354l-1.086-1.086ZM11.19 6.25 9.75 4.81 3.862 10.7a.253.253 0 0 0-.064.108l-.558 1.953 1.953-.557a.253.253 0 0 0 .108-.065L11.19 6.25Z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
)

const navItems = [
  { href: "/dashboard", label: "대시보드", icon: IconDashboard },
  { href: "/journeys", label: "여정 관리", icon: IconMap },
  { href: "/prompts", label: "글감 관리", icon: IconPencil },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-separator bg-surface">
      <div className="flex h-14 items-center gap-2.5 border-b border-separator px-5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-foreground text-xs font-bold text-background">
          글
        </div>
        <span className="text-sm font-semibold tracking-tight text-foreground">
          글필 어드민
        </span>
      </div>
      <nav className="flex flex-col gap-0.5 p-3">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "justify-start gap-2.5",
                isActive
                  ? "bg-default text-foreground"
                  : "text-muted hover:text-foreground"
              )}
            >
              <Icon className="shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
